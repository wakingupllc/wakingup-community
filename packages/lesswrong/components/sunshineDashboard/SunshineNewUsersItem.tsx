/* global confirm */
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { withUpdate } from '../../lib/crud/withUpdate';
import React, { useState } from 'react';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper'
import moment from 'moment';
import { useCurrentUser } from '../common/withUser';
import { useHover } from '../common/withHover'
import withErrorBoundary from '../common/withErrorBoundary'
import red from '@material-ui/core/colors/red';
import DoneIcon from '@material-ui/icons/Done';
import SnoozeIcon from '@material-ui/icons/Snooze';
import DeleteForeverIcon from '@material-ui/icons/DeleteForever';
import RemoveCircleOutlineIcon from '@material-ui/icons/RemoveCircleOutline';
import DescriptionIcon from '@material-ui/icons/Description'
import { useMulti } from '../../lib/crud/withMulti';
import MessageIcon from '@material-ui/icons/Message'
import Button from '@material-ui/core/Button';
import * as _ from 'underscore';
import { DatabasePublicSetting } from '../../lib/publicSettings';

export const defaultModeratorComments = new DatabasePublicSetting<Array<string>>('defaultModeratorComments', ["yMHoNoYZdk5cKa3wQ"])


const styles = (theme: ThemeType): JssStyles => ({
  negativeKarma: {
     color: red['A100']
  },
  info: {
    // Wrap between MetaInfo elements. Non-standard CSS which may not work in Firefox.
    wordBreak: "break-word",
    display: "inline-block"
  },
  truncated: {
    maxHeight: 800,
    overflow: "hidden"
  },
  icon: {
    height: 13,
    color: theme.palette.grey[500],
    position: "relative",
    top: 3
  },
  hoverPostIcon: {
    height: 16,
    color: theme.palette.grey[700],
    position: "relative",
    top: 3
  },
  reviewed: {
    backgroundColor: theme.palette.grey[100]
  },
  row: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center"
  },
  bigDownvotes: {
    color: theme.palette.error.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
    border: `solid 2px ${theme.palette.error.dark}`
  },
  downvotes: {
    color: theme.palette.error.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    border: `solid 1px ${theme.palette.error.dark}`
  },
  upvotes: {
    color: theme.palette.primary.dark,
    opacity: .75,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    border: `solid 1px ${theme.palette.primary.dark}`
  },
  bigUpvotes: {
    color: theme.palette.primary.dark,
    padding: 6,
    paddingTop: 3,
    paddingBottom: 3,
    marginRight:8,
    borderRadius: "50%",
    fontWeight: 600,
    border: `solid 2px ${theme.palette.primary.dark}`
  },
  votesRow: {
    marginTop: 12,
    marginBottom: 12
  },
  hr: {
    height: 0,
    borderTop: "none",
    borderBottom: "1px solid #ccc"
  }
})
const SunshineNewUsersItem = ({ user, classes, updateUser, allowContentPreview=true }: {
  user: SunshineUsersList,
  classes: ClassesType,
  updateUser?: any,
  allowContentPreview?: boolean,
}) => {
  const currentUser = useCurrentUser();
  const [hidden, setHidden] = useState(false)
  const [truncated, setTruncated] = useState(true)
  const { eventHandlers, hover, anchorEl } = useHover();

  const handleReview = () => {
    updateUser({
      selector: {_id: user._id},
      data: {
        reviewedByUserId: currentUser!._id,
        reviewedAt: new Date(),
        sunshineSnoozed: false,
        needsReview: false,
      }
    })
  }

  const handleSnooze = () => {
    updateUser({
      selector: {_id: user._id},
      data: {
        needsReview: false,
        reviewedAt: new Date(),
        reviewedByUserId: currentUser!._id,
        sunshineSnoozed: true
      }
    })
  }

  const handleBan = async () => {
    if (confirm("Ban this user for 3 months?")) {
      setHidden(true)
      await updateUser({
        selector: {_id: user._id},
        data: {
          reviewedByUserId: currentUser!._id,
          voteBanned: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(3, 'months').toDate()
        }
      })
    }
  }

  const handlePurge = async () => {
    if (confirm("Are you sure you want to delete all this user's posts, comments and votes?")) {
      setHidden(true)
      await updateUser({
        selector: {_id: user._id},
        data: {
          reviewedByUserId: currentUser!._id,
          nullifyVotes: true,
          voteBanned: true,
          deleteContent: true,
          needsReview: false,
          reviewedAt: new Date(),
          banned: moment().add(12, 'months').toDate()
        }
      })
    }
  }

  const { results: posts, loading: postsLoading } = useMulti({
    terms:{view:"sunshineNewUsersPosts", userId: user._id},
    collectionName: "Posts",
    fragmentName: 'SunshinePostsList',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });

  const { results: comments, loading: commentsLoading } = useMulti({
    terms:{view:"sunshineNewUsersComments", userId: user._id},
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    fetchPolicy: 'cache-and-network',
    limit: 50
  });

  const commentKarmaPreviews = comments ? _.sortBy(comments, c=>c.baseScore) : []
  const postKarmaPreviews = posts ? _.sortBy(posts, p=>p.baseScore) : []

  const { SunshineListItem, SidebarHoverOver, MetaInfo, FormatDate, SunshineNewUserPostsList, SunshineNewUserCommentsList, CommentKarmaWithPreview, PostKarmaWithPreview, LWTooltip, Loading, NewConversationButton, Typography } = Components

  if (hidden) { return null }

  const hiddenPostCount = user.maxPostCount - user.postCount
  const hiddenCommentCount = user.maxCommentCount - user.commentCount

  const templateId = defaultModeratorComments.get()[0]

  return (
    <span {...eventHandlers}>
      <SunshineListItem hover={hover}>
        <SidebarHoverOver hover={hover} anchorEl={anchorEl}>
          <Typography variant="body2">
            <MetaInfo>
              {user.reviewedAt ? <p><em>Reviewed <FormatDate date={user.reviewedAt}/> ago by {user.reviewedByUserId}</em></p> : null }
              {user.banned ? <p><em>Banned until <FormatDate date={user.banned}/></em></p> : null }
              <div>ReCaptcha Rating: {user.signUpReCaptchaRating || "no rating"}</div>
              <div dangerouslySetInnerHTML={{__html: user.htmlBio}}/>
              <hr className={classes.hr}/>
              <div className={classes.row}>
                {!!(user.maxCommentCount || user.maxPostCount) && <LWTooltip title="Review">
                  <Button onClick={handleReview}>
                    <DoneIcon /> Review
                  </Button>
                </LWTooltip>}
                <LWTooltip title="Snooze (approve all posts)">
                  <Button title="Snooze" onClick={handleSnooze}>
                    <SnoozeIcon /> Snooze
                  </Button>
                </LWTooltip>
                {!user.reviewedByUserId && <LWTooltip title="Purge (delete and ban)">
                  <Button onClick={handlePurge}>
                    <DeleteForeverIcon /> Purge
                  </Button>
                 </LWTooltip>}
                {user.reviewedByUserId && <LWTooltip title="">
                  <Button onClick={handleBan}>
                    <RemoveCircleOutlineIcon /> Ban
                  </Button>
                </LWTooltip>}
                {currentUser && <NewConversationButton user={user} currentUser={currentUser} templateCommentId={templateId}>
                  <Button variant="outlined">Message</Button>
                </NewConversationButton>}
              </div>
              <hr className={classes.hr}/>
              <div className={classes.votesRow}>
                <LWTooltip title="Big Upvotes">
                  <span className={classes.bigUpvotes}>
                    { user.bigUpvoteCount || 0 }
                  </span>
                </LWTooltip>
                <LWTooltip title="Upvotes">
                  <span className={classes.upvotes}>
                    { user.smallUpvoteCount || 0 }
                  </span>
                </LWTooltip>
                <LWTooltip title="Downvotes">
                  <span className={classes.downvotes}>
                    { user.smallDownvoteCount || 0 }
                  </span>
                </LWTooltip>
                <LWTooltip title="Big Downvotes">
                  <span className={classes.bigDownvotes}>
                    { user.bigDownvoteCount || 0 }
                  </span>
                </LWTooltip>
              </div>
              <div>
                <LWTooltip title="Post count">
                  <span>
                    { user.postCount || 0 }
                    <DescriptionIcon className={classes.hoverPostIcon}/>
                  </span> 
                </LWTooltip>
                {postKarmaPreviews.map(post => <PostKarmaWithPreview key={post._id} post={post}/>)}
                { hiddenPostCount ? <span> ({hiddenPostCount} deleted)</span> : null} 
              </div>
              {(commentsLoading || postsLoading) && <Loading/>}
              <div>
                <LWTooltip title="Comment count">
                  { user.commentCount || 0 }
                </LWTooltip>
                <MessageIcon className={classes.icon}/> 
                {commentKarmaPreviews.map(comment => <CommentKarmaWithPreview key={comment._id} comment={comment}/>)}
                { hiddenCommentCount ? <span> ({hiddenCommentCount} deleted)</span> : null}
              </div>
              <SunshineNewUserPostsList posts={posts} user={user}/>
              <SunshineNewUserCommentsList comments={comments} user={user}/>
            </MetaInfo>
          </Typography>
        </SidebarHoverOver>
        <div>
          <MetaInfo className={classes.info}>
            { user.karma || 0 }
          </MetaInfo>
          <MetaInfo className={classes.info}>
            <Link className={user.karma < 0 ? classes.negativeKarma : ""} to={userGetProfileUrl(user)}>
                {user.displayName}
            </Link>
          </MetaInfo>
          <MetaInfo className={classes.info}>
            <FormatDate date={user.createdAt}/>
          </MetaInfo>
          {(user.postCount > 0 && !user.reviewedByUserId) && <DescriptionIcon  className={classes.icon}/>}
          {!user.reviewedByUserId && <MetaInfo className={classes.info}>
            { user.email }
          </MetaInfo>}
        </div>
      </SunshineListItem>
    </span>
  )
}

const SunshineNewUsersItemComponent = registerComponent('SunshineNewUsersItem', SunshineNewUsersItem, {
  styles,
  hocs: [
    withUpdate({
      collectionName: "Users",
      fragmentName: 'SunshineUsersList',
    }),
    withErrorBoundary,
  ]
});

declare global {
  interface ComponentTypes {
    SunshineNewUsersItem: typeof SunshineNewUsersItemComponent
  }
}

