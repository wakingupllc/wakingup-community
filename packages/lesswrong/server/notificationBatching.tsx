import React from 'react';
import { Notifications } from '../lib/collections/notifications/collection';
import { getNotificationTypes } from '../lib/notificationTypes';
import { getNotificationTypeByNameServer } from './notificationTypesServer';
import { EventDebouncer } from './debouncer';
import toDictionary from '../lib/utils/toDictionary';
import { userIsAdmin } from '../lib/vulcan-users/permissions';
import { getUser } from '../lib/vulcan-users/helpers';
import { Posts } from '../lib/collections/posts';
import { Components } from '../lib/vulcan-lib/components';
import { addGraphQLQuery, addGraphQLSchema, addGraphQLResolvers } from '../lib/vulcan-lib/graphql';
import { wrapAndSendEmail, wrapAndRenderEmail } from './emails/renderEmail';
import { getUserEmail } from "../lib/collections/users/helpers";
import { sendEmailSendgridTemplate, useSendgridTemplatesSetting } from './emails/sendEmail';

// string (notification type name) => Debouncer
export const notificationDebouncers = toDictionary(getNotificationTypes(),
  notificationTypeName => notificationTypeName,
  notificationTypeName => {
    return new EventDebouncer({
      name: `notification_${notificationTypeName}`,
      defaultTiming: {
        type: "delayed",
        delayMinutes: 15,
      },
      callback: ({ userId, notificationType }: {userId: string, notificationType: string}, notificationIds: Array<string>) => {
        void sendNotificationBatch({userId, notificationIds});
      }
    });
  }
);

// Precondition: All notifications in a batch share a notification type
const sendNotificationBatch = async ({userId, notificationIds}: {userId: string, notificationIds: Array<string>}) => {
  if (!notificationIds || !notificationIds.length)
    throw new Error("Missing or invalid argument: notificationIds (must be a nonempty array)");
  
  const user = await getUser(userId);
  if (!user) throw new Error(`Missing user: ID ${userId}`);
  await Notifications.rawUpdateMany(
    { _id: {$in: notificationIds} },
    { $set: { waitingForBatch: false } },
    { multi: true }
  );
  const notificationsToEmail = await Notifications.find(
    { _id: {$in: notificationIds}, emailed: true }
  ).fetch();
  
  if (notificationsToEmail.length) {
    const groupedNotifications = await groupNotifications({user, notifications: notificationsToEmail});
    if (useSendgridTemplatesSetting.get()) {
      /** Example notification data:
       * [
    {
      _id: 'xsLHawAnDK9kBzmza',
      userId: 'vFmaN5HM4HkJpwgXm',
      documentId: 'muCkEoteKzeLMLjsa',
      documentType: 'message',
      extraData: null,
      link: '/inbox/NtwCrStHpoWLTkdwq',
      title: null,
      message: 'Will Howard sent you a new message!',
      type: 'newMessage',
      deleted: false,
      viewed: false,
      emailed: true,
      waitingForBatch: false,
      schemaVersion: 1,
      createdAt: 2023-09-12T21:57:19.465Z,
      legacyData: null
    }
  ]
       */
      for (let batch of groupedNotifications) {
        const notificationTypeRenderer = getNotificationTypeByNameServer(batch[0].type)
        // If we are combining notifications into a single email, make sure to use the "Multiple" template
        const templateName = batch.length > 1 ? {templateName: `${batch[0].type}Multiple`} : {}
        const sendgridData = {
          user,
          to: getUserEmail(user),
          dynamicTemplateData: await notificationTypeRenderer.emailTemplateData?.({user, notifications: batch}),
          notifications: batch,
          ...templateName
        }
        await sendEmailSendgridTemplate(sendgridData)
      }
      
      return
    }
    const emails = await notificationBatchToEmails({
      user, notifications: groupedNotifications
    });
    
    for (let email of emails) {
      await wrapAndSendEmail(email);
    }
  }
}

/**
 * Given an array of notifications to send to a user, returns them restructured as an array of batches of notifications.
 * A batch is either an array of notifications that can be combined into a single email, or an array with a single notification.
 * This also handles filtering out notifications that should be skipped.
 */
const groupNotifications = async ({user, notifications}: {user: DbUser, notifications: Array<DbNotification>}) => {
  const notificationType = notifications[0].type;
  const notificationTypeRenderer = getNotificationTypeByNameServer(notificationType);
  
  // Each call to emailSubject or emailBody takes a list of notifications.
  // If we can combine the emails this will be all the notifications in the batch, if we can't combine the emails, this will be a list containing a single notification.
  const groupedNotifications = notificationTypeRenderer.canCombineEmails ? [notifications] : notifications.map((notification) => [notification])

  const shouldSkip = await Promise.all(groupedNotifications.map(async notifications => notificationTypeRenderer.skip({ user, notifications })));
  const nonSkippedNotifications = groupedNotifications
    .filter((_, idx) => !shouldSkip[idx])
  
  return nonSkippedNotifications;
}

const notificationBatchToEmails = async ({user, notifications}: {user: DbUser, notifications: Array<Array<DbNotification>>}) => {
  const notificationType = notifications[0][0].type;
  const notificationTypeRenderer = getNotificationTypeByNameServer(notificationType);

  return await Promise.all(
    notifications
      .map(async (notifications: DbNotification[]) => ({
        user,
        to: getUserEmail(user),
        from: notificationTypeRenderer.from,
        subject: await notificationTypeRenderer.emailSubject({ user, notifications }),
        body: await notificationTypeRenderer.emailBody({ user, notifications }),
      }))
  );
}


addGraphQLResolvers({
  Query: {
    async EmailPreview(root: void, {notificationIds, postId}: {notificationIds?: Array<string>, postId?: string}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser || !userIsAdmin(currentUser)) {
        throw new Error("This debug feature is only available to admin accounts");
      }
      if (!notificationIds?.length && !postId) {
        return [];
      }
      if (notificationIds?.length && postId) {
        throw new Error("Please only specify notificationIds or postId in the query")
      }
      
      let emails:any[] = []
      if (notificationIds?.length) {
        const notifications = await Notifications.find(
          { _id: {$in: notificationIds} }
        ).fetch();
        const groupedNotifications = await groupNotifications({user: currentUser, notifications});
        emails = await notificationBatchToEmails({
          user: currentUser,
          notifications: groupedNotifications
        });
      }
      if (postId) {
        const post = await Posts.findOne(postId)
        if (post) {
          emails = [{
            user: currentUser,
            subject: post.title,
            body: <Components.NewPostEmail documentId={post._id} reason='you have the "Email me new posts in Curated" option enabled' />
          }]
        }
      }
      const renderedEmails = await Promise.all(emails.map(async email => await wrapAndRenderEmail(email)));
      return renderedEmails;
    }
  }
});
addGraphQLSchema(`
  type EmailPreview {
    to: String
    subject: String
    html: String
    text: String
  }
`);
addGraphQLQuery("EmailPreview(notificationIds: [String], postId: String): [EmailPreview]");
