import React, {useEffect, useRef, useState} from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useSingle } from '../../lib/crud/withSingle';
import { useMulti } from '../../lib/crud/withMulti';
import { conversationGetTitle } from '../../lib/collections/conversations/helpers';
import withErrorBoundary from '../common/withErrorBoundary';
import { Link } from '../../lib/reactRouterWrapper';
import { useLocation } from '../../lib/routeUtil';
import { useTracking } from '../../lib/analyticsEvents';
import { getBrowserLocalStorage } from '../editor/localStorageHandlers';
import { userCanDo } from '../../lib/vulcan-users';
import { useOnNotificationsChanged } from '../hooks/useUnreadNotifications';

const styles = (theme: ThemeType): JssStyles => ({
  conversationSection: {
    maxWidth: 550,
  },
  conversationTitle: {
    ...theme.typography.commentStyle,
    marginTop: theme.spacing.unit,
    marginBottom: theme.spacing.unit*1.5
  },
  editor: {
    marginTop: theme.spacing.unit*4,
    position:"relative",
    "& .ck.ck-content": {
      paddingLeft: "1.5rem",
      paddingTop: "1rem",
    },
    "& .EditorFormComponent-root": {
      backgroundColor: theme.palette.text.alwaysWhite,
      borderRadius: 6,
    },
    "& .form-submit .MuiButtonBase-root": {
      marginLeft: 0,
    },
  },
  backButton: {
    color: theme.palette.lwTertiary.main
  },
  row: {
    display: "flex",
    justifyContent: "space-between"
  }
})

/**
 * Page for viewing a private messages conversation. Typically invoked from
 * ConversationWrapper, which takes care of the URL parsing.
 */
const ConversationPage = ({ conversationId, currentUser, classes }: {
  conversationId: string,
  currentUser: UsersCurrent,
  classes: ClassesType,
}) => {
  // Count messages sent, and use it to set a distinct value for `key` on `NewMessageForm`
  // that increments with each message. This is a way of clearing the form, which works
  // around problems inside the editor related to debounce timers and autosave and whatnot,
  // by guaranteeing that it's a fresh set of react components each time.
  const [messageSentCount,setMessageSentCount] = useState(0);

  const [numMessagesShown,setNumMessagesShown] = useState(0);

  const { results, refetch, loading: loadingMessages } = useMulti({
    terms: {
      view: 'messagesConversation',
      conversationId,
    },
    collectionName: "Messages",
    fragmentName: 'messageListFragment',
    fetchPolicy: 'cache-and-network',
    limit: 100000,
    enableTotal: false,
  });
  const { document: conversation, loading: loadingConversation } = useSingle({
    documentId: conversationId,
    collectionName: "Conversations",
    fragmentName: 'conversationsListFragment',
  });
  const loading = loadingMessages || loadingConversation;

  const { query } = useLocation()
  const { captureEvent } = useTracking()
  
  // Whenever the number of messages shown goes up, scroll to bottom
  // This happens on pageload, and also happens when the messages list is refreshed
  // because of the useOnNotificationsChanged() call below, if the refresh
  // increased the message count.
  //
  // Note, if you're refreshing (as opposed to navigating or opening a new
  // tab), this can wind up fighting with the browser's scroll restoration (see
  // client/scrollRestoration.ts).
  useEffect(() => {
    const newNumMessages = (results?.length ?? 0)
    if (newNumMessages > numMessagesShown) {
      setNumMessagesShown(newNumMessages);
      setTimeout(()=>{
        window.scroll({top: document.body.scrollHeight-550, behavior: 'smooth'})
      }, 0);
    }
  }, [numMessagesShown, results?.length]);
  
  useOnNotificationsChanged(currentUser, () => refetch());
  
  // try to attribute this sent message to where the user came from
  const profileViewedFrom = useRef('')
  useEffect(() => {
    const ls = getBrowserLocalStorage()
    if (query.from) {
      profileViewedFrom.current = query.from
    } else if (conversation && conversation.participantIds.length === 2 && ls) {
      // if this is a conversation with one other person, see if we have info on where the current user found them
      const otherUserId = conversation.participantIds.find(id => id !== currentUser._id)
      const lastViewedProfiles = JSON.parse(ls.getItem('lastViewedProfiles'))
      profileViewedFrom.current = lastViewedProfiles?.find((profile: any) => profile.userId === otherUserId)?.from
    }
  }, [query.from, conversation, currentUser._id])

  const { SingleColumnSection, ConversationDetails, NewMessageForm, Error404, Loading, MessageItem, Typography } = Components
  
  const renderMessages = () => {
    if (loading && !results) return <Loading />
    if (!results?.length) return null
    
    return <div>
      {results.map((message) => (<MessageItem key={message._id} message={message} />))}
    </div>
  }

  if (loading && !results) return <Loading />
  if (!conversation) return <Error404 />

  const showModInboxLink = userCanDo(currentUser, 'conversations.view.all') && conversation.moderator

  return (
    <SingleColumnSection>
      <div className={classes.conversationSection}>
        <div className={classes.row}>
          <Typography variant="body2" className={classes.backButton}><Link to="/inbox"> Go back to Inbox </Link></Typography>
          {showModInboxLink && <Typography variant="body2" className={classes.backButton}>
            <Link to="/moderatorInbox"> Moderator Inbox </Link>
          </Typography>}
        </div>
        <Typography variant="display2" className={classes.conversationTitle}>
          { conversationGetTitle(conversation, currentUser)}
        </Typography>
        <ConversationDetails conversation={conversation}/>
        {renderMessages()}
        <div className={classes.editor}>
          <NewMessageForm
            key={`sendMessage-${messageSentCount}`}
            conversationId={conversation._id}
            templateQueries={{templateId: query.templateId, displayName: query.displayName}}
            successEvent={() => {
              setMessageSentCount(messageSentCount+1);
              captureEvent('messageSent', {
                conversationId: conversation._id,
                sender: currentUser._id,
                participantIds: conversation.participantIds,
                messageCount: (conversation.messageCount || 0) + 1,
                ...(profileViewedFrom?.current && {from: profileViewedFrom.current})
              })
            }}
          />
        </div>
      </div>
    </SingleColumnSection>
  )
}

const ConversationPageComponent = registerComponent('ConversationPage', ConversationPage, {
  styles,
  hocs: [withErrorBoundary]
});

declare global {
  interface ComponentTypes {
    ConversationPage: typeof ConversationPageComponent
  }
}

