import {createAndSetToken} from '../vulcan-lib/apollo-server/authentication'
import {Users} from '../../lib/collections/users/collection'
import {DatabaseServerSetting} from '../databaseSettings'
import {createMutator, updateMutator} from '../vulcan-lib/mutators'
import {userFindOneByEmail} from '../commonQueries'
import request from 'request'
import {
  addGraphQLMutation,
  addGraphQLResolvers,
  addGraphQLSchema,
  AuthorizationError,
  getUser,
  slugify,
  Utils,
} from '../vulcan-lib'
import type {AddMiddlewareType} from '../apolloServer'
import express from 'express'
import {cloudinaryPublicIdFromUrl, moveToCloudinary} from '../scripts/convertImagesToCloudinary'
import {
  devWakingUpCodeSetting,
  wuDefaultProfileImageCloudinaryIdSetting,
} from '../../lib/publicSettings.ts'
import { sendEmailSendgridTemplate } from '../emails/sendEmail.ts'
import moment from 'moment'
import { CODE_ENTRY_LIMIT, CODE_ENTRY_LIMIT_EXCEEDED_MSG, CODE_REQUEST_LIMIT_EXCEEDED_MSG } from '../../lib/collections/users/constants.ts'
import { codeEntryLockExpiresAt, codeRequestLimitActive, codeRequestLimitExpiresAt, isCodeEntryLocked, isCodeRequestLocked } from '../../lib/collections/users/helpers.tsx'
import {usernameIsBadWord} from '../../lib/collections/users/username'
import { getCookieFromReq } from '../utils/httpUtil.ts'

// This file has middleware for redirecting logged-out users to the login page,
// but it also manages authentication with the Waking Up app. This latter thing
// is not actually middleware, but it's useful to use the forumSpecificMiddleware
// system to manage it.

const authMessageWithEmail = (email: string) => `Sorry, the email ${email} doesn't have access to the Waking Up Community. Email community@wakingup.com if you think this is a mistake.`
const deletedAccountMessage = (email: string) => `The community account for ${email} has been deactivated. Please email us at community@wakingup.com if you think this is a mistake.`

function urlDisallowedForLoggedOutUsers(req: express.Request) {
  if (req.user) return false;

  const whiteListPaths = ['/', '/code', '/graphql', '/analyticsEvent', '/browserconfig.xml', '/site.webmanifest']
  if (whiteListPaths.includes(req.path)) return false
  if (req.path.startsWith('/js/bundle.js')) return false
  if (req.path.startsWith('/allStyles')) return false

  return true
}

// Logged-out users should be redirected to the home login page for all requests
// (Except requests that are made from the home page, like the logo, JavaScript, and CSS.)
export const redirectLoggedOutMiddleware = (req: express.Request, res: express.Response, next: express.NextFunction) => {
  if (urlDisallowedForLoggedOutUsers(req)) {
    res.redirect('/');
  } else {
    next();
  }
}

async function logoutDeletedUser(req: express.Request, res: express.Response, next: express.NextFunction) {
  const loginToken = getCookieFromReq(req, 'loginToken')
  const user = await getUser(loginToken)
  if (user?.deleted) {
    req.logout();
    res.cookie('loginToken', '', { expires: new Date(0) });
    res.redirect('/');
    return;
  }
  next();
}

export const wuMiddleware = (addConnectHandler: AddMiddlewareType) => {
  addConnectHandler(redirectLoggedOutMiddleware);
  addConnectHandler(logoutDeletedUser);
}

const wakingUpKeySetting = new DatabaseServerSetting<string | null>('wakingUpKey', null)
const wakingUpEndpointSetting = new DatabaseServerSetting<string | null>('wakingUpEndpoint', null)

function isValidWuUser(wuUser: WuUserData) {
  return (!!wuUser.email &&
    wuUser.subscription_status === 'ACTIVE' &&
    wuUser.forum_access
  )
}

function sampleResponse(email: string) {
  // hardcoded response for testing
  return Promise.resolve({
    "avatar": "https://d6ttkheexoy1x.cloudfront.net/shared/images/1657_e80a7cad-7dd1-405c-906e-2476fa7fb3f2",
    "city": "Berkeley",
    "created_at": "2019-05-07T15:39:56.000Z",
    "email": email,
    "first_name": "Michael",
    "forum_access": false,
    "has_ever_been_paid_subscriber": true,
    "last_name": "Keenan",
    "subscription_expires_at": "2024-07-13T21:19:27.000Z",
    "subscription_status": "ACTIVE",
    "uuid": "3d7016ab-ed98-4099-95ff-f567561bd1e2"
  })
}

async function getWakingUpUserData(email: string): Promise<any> {
  const wakingUpKey = wakingUpKeySetting.get()
  const wakingUpEndpoint = wakingUpEndpointSetting.get()

  // The Waking Up API expects email addresses to be in lowercase.
  const url = `${wakingUpEndpoint}${email.toLowerCase()}`;
  const headers = {
    'x-community-key': wakingUpKey,
  };
  const options = {
    url,
    headers,
    json: true,
  };
  return new Promise((resolve, reject) => {
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

/* Example data:
{
    "avatar": "https://d6ttkheexoy1x.cloudfront.net/shared/images/1657_e80a7cad-7dd1-405c-906e-2476fa7fb3f2",
    "city": "Gijon",
    "created_at": "2019-05-07T15:39:56.000Z",
    "email": "jose@fivekoalas.com",
    "first_name": "Jose",
    "forum_access": false,
    "has_ever_been_paid_subscriber": true,
    "last_name": "Dev",
    "subscription_expires_at": "2024-07-13T21:19:27.000Z",
    "subscription_status": "ACTIVE",
    "uuid": "3d7016ab-ed98-4099-95ff-f567561bd1e2"
}
*/

type WuUserData = {
  avatar?: string,
  city?: string,
  created_at?: string,
  email?: string,
  first_name?: string,
  forum_access?: boolean,
  has_ever_been_paid_subscriber?: boolean,
  last_name?: string,
  subscription_expires_at?: string,
  subscription_status?: string,
  uuid?: string,
  message?: string,
}

async function syncOrCreateWuUser(wuUser: WuUserData): Promise<DbUser> {
  let user = await Users.findOne({'wu_uuid': wuUser.uuid})
  if (user) {
    user = await syncWuUser(user, wuUser)
  } else {
    user = await createWuUser(wuUser)
  }

  return user
}

function wuUserFields(wuUser: WuUserData) {
  return {
    email: wuUser.email,
    avatar: wuUser.avatar,
    wu_created_at: new Date(wuUser.created_at!),
    wu_forum_access: wuUser.forum_access,
    wu_has_ever_been_paid_subscriber: wuUser.has_ever_been_paid_subscriber,
    wu_subscription_expires_at: new Date(wuUser.subscription_expires_at!),
    wu_subscription_active: wuUser.subscription_status === 'ACTIVE',
  };
}

async function syncWuUser(user: DbUser, wuUser: WuUserData): Promise<DbUser> {
  const requiredFields = ['email', 'created_at', 'subscription_expires_at', 'subscription_status', 'forum_access'];
  for (const field of requiredFields) {
    if (!wuUser[field as keyof WuUserData]) {
      throw new Error(`wuUser.${field} is required`);
    }
  }

  const updatedUserResponse = await updateMutator({
    collection: Users,
    documentId: user._id,
    set: wuUserFields(wuUser),
    validate: false
  })

  return updatedUserResponse.data
}

async function createWuUser(wuUser: WuUserData): Promise<DbUser> {
  const { data: userCreated } = await createMutator({
    collection: Users,
    document: {
      ...wuUserFields(wuUser),
      wu_uuid: wuUser.uuid,
      first_name: wuUser.first_name,
      last_name: wuUser.last_name,
      displayName: wuDisplayName(wuUser),
      username: await Utils.getUnusedSlugByCollectionName("Users", slugify(wuDisplayName(wuUser))),
      usernameUnset: true,
      profileImageId: await getProfileImageId(wuUser),
    },
    validate: false,
    currentUser: null
  })
  return userCreated
}

async function getProfileImageId(wuUser: WuUserData) {
  if (!wuUser.avatar) return wuDefaultProfileImageCloudinaryIdSetting.get()
  return await rehostProfileImageToCloudinary(wuUser.avatar)
}

const rehostProfileImageToCloudinary = async (url: string) => {
  const folder = 'profileImages'
  const newUrl = await moveToCloudinary(url, folder)
  if (!newUrl) return undefined
  
  return cloudinaryPublicIdFromUrl(newUrl, folder)
}

const defaultName = (wuUser: WuUserData): string => {
  if (wuUser.first_name && wuUser.last_name) {
    return `${wuUser.first_name} ${wuUser.last_name}`
  } else if (wuUser.first_name) {
    return wuUser.first_name
  } else if (wuUser.last_name) {
    return wuUser.last_name
  } else {
    return wuUser.email!.split('@')[0]
  }
}

function wuDisplayName(wuUser: WuUserData): string {
  const name = defaultName(wuUser)

  if (usernameIsBadWord(name)) {
    return 'newuser'
  } else {
    return name
  }
}

const requestedCodeData = `type requestedCodeData {
  result: String
}`

const loginData = `type LoginReturnData2 {
  token: String
}`

addGraphQLSchema(loginData);
addGraphQLSchema(requestedCodeData);

function wuProps(user: DbUser) {
  return user.services?.wakingUp
}

function updateUserLoginProps(user: DbUser, oneTimeCode: string|null, successfulLogin = false) {
  const fieldUpdates = successfulLogin ? {
    otcRequests: 0,
    otcEntryAttempts: 0,
    otcEntryLockedAt: null,
    codeRequestLimitStartAt: null,
    oneTimeCode: null,
} : {
    codeRequestLimitStartAt: codeRequestLimitActive(user) ?? new Date(),
    otcRequests: (wuProps(user)?.otcRequests ?? 0) + 1,
    oneTimeCode,
}

  return Users.rawUpdateOne(
    {_id: user._id},
    {$set: {services: {
      ...(user.services),
      "wakingUp": {
        ...wuProps(user),
        ...fieldUpdates,
      }
    }}}
  );
}

function assertCodeRequestNotLocked(user: DbUser) {
  if (isCodeRequestLocked(user)) {
    throw new AuthorizationError({
      message: loginCodeRequestLockedMessage(user),
      internalData: { error: CODE_REQUEST_LIMIT_EXCEEDED_MSG }}
    );
  }
}

function assertCodeEntryNotLocked(user: DbUser) {
  if (isCodeEntryLocked(user)) {
    throw new AuthorizationError({
      message: loginCodeEntryLockedMessage(user),
      internalData: { error: CODE_ENTRY_LIMIT_EXCEEDED_MSG }}
    );
  }
}

function minutesUntil(date: moment.Moment) {
  const duration = moment.duration(moment(date).diff(moment()));
  return Math.ceil(duration.asMinutes());
}

function loginCodeRequestLockedMessage(user: DbUser) {
  const limitExpiresAt = codeRequestLimitExpiresAt(user)

  return `You've requested too many codes recently. You can request a new code in ${minutesUntil(limitExpiresAt!)} minutes or email community@wakingup.com for help.`;
}

function loginCodeEntryLockedMessage(user: DbUser) {
  const lockedAt = codeEntryLockExpiresAt(user);

  return `You have attempted too many invalid codes. You can try again in ${minutesUntil(lockedAt!)} minutes or email community@wakingup.com for help.`
}

async function incrementOtcEntryAttempts(user: DbUser) {
  const otcEntryAttempts = (wuProps(user)?.otcEntryAttempts ?? 0) + 1;

  const fieldUpdates = otcEntryAttempts > CODE_ENTRY_LIMIT - 1 ? {
    otcEntryLockedAt: new Date(),
    oneTimeCode: null,
    otcEntryAttempts: 0,
  } : {
    otcEntryAttempts: otcEntryAttempts
  }

  wuProps(user).otcEntryLockedAt = fieldUpdates.otcEntryLockedAt

  return await Users.rawUpdateOne(
    {_id: user._id},
    {$set: {services: {
      ...(user.services),
      "wakingUp": {
        ...wuProps(user),
        ...fieldUpdates,
      }
    }}}
  );
}

const authenticationResolvers = {
  Mutation: {
    async requestLoginCode(root: void, { email }: {email: string}, { req, res }: ResolverContext) {
      if (!email) {
        throw new Error('Email missing')
      }

      const wuUser = await getWakingUpUserData(email);

      if (isValidWuUser(wuUser)) {
        const user = await syncOrCreateWuUser(wuUser)

        if (user?.deleted) throw new AuthorizationError({ message: deletedAccountMessage(email), internalData: { error: "User has been deleted" }});

        assertCodeRequestNotLocked(user);
        assertCodeEntryNotLocked(user);

        const oneTimeCode = Math.floor(1000 + (Math.random() * 9000)).toString();

        await updateUserLoginProps(user, oneTimeCode)

        const sendgridData = {
          to: wuUser.email,
          dynamicTemplateData: {
            email: wuUser.email,
            pin: oneTimeCode,
            pin1: oneTimeCode[0],
            pin2: oneTimeCode[1],
            pin3: oneTimeCode[2],
            pin4: oneTimeCode[3],
            year: new Date().getFullYear(),
          },
          templateName: 'loginCode'
        }

        await sendEmailSendgridTemplate(sendgridData)
      } else {
        throw new AuthorizationError({ message: authMessageWithEmail(email), internalData: { error: "Invalid Waking Up user" } })
      }
      return { result: "success" }
    },

    async codeLogin(root: void, { email, code }: {email: string, code: string}, { req, res }: ResolverContext) {
      const user = await userFindOneByEmail(email);

      if (!user?.wu_subscription_active) throw new AuthorizationError({ message: authMessageWithEmail(email), internalData: { error: "Inactive WU subscription" }});
      if (!user.wu_forum_access) throw new AuthorizationError({ message: authMessageWithEmail(email), internalData: { error: "WU account lacks forum access" }});
      if (user?.deleted) throw new AuthorizationError({ message: deletedAccountMessage(email), internalData: { error: "User has been deleted" }});

      assertCodeEntryNotLocked(user);

      const validCode = user && code?.length > 0 && wuProps(user)?.oneTimeCode === code;
      const devCodeOkay = devWakingUpCodeSetting.get() && user && code === devWakingUpCodeSetting.get()

      if (validCode || devCodeOkay) {
        await updateUserLoginProps(user, null, true)

        const token = await createAndSetToken(req, res, user)
        return { token };
      } else {
        await incrementOtcEntryAttempts(user);
        assertCodeEntryNotLocked(user);
        throw new AuthorizationError({
          message: "Sorry, that code is incorrect or expired.",
          internalData: { error: "Invalid one-time code" },
          data: { invalidCode: true },
        });
      }
    },

    async unlockLogin(root: void, { userSlug }: {userSlug: string}, context: ResolverContext) {
      const { currentUser } = context;
      if (!currentUser?.isAdmin) throw new AuthorizationError({ message: "Non-admin user attempted to unlock login." });

      const user = (await Users.findOne({slug: userSlug}));
      if (!user) throw Error("Can't find user with given slug")
      if (user.deleted) throw Error("User is deleted")

      await updateUserLoginProps(user, null, true)
    }
  } 
};

addGraphQLResolvers(authenticationResolvers);

addGraphQLMutation('requestLoginCode(email: String): requestedCodeData');
addGraphQLMutation('codeLogin(email: String, code: String): LoginReturnData2');
addGraphQLMutation('unlockLogin(userSlug: String): String');
