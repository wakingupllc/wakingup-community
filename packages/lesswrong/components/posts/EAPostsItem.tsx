import React, { FC, MouseEvent } from "react";
import { registerComponent, Components } from "../../lib/vulcan-lib";
import { AnalyticsContext } from "../../lib/analyticsEvents";
import { usePostsItem, PostsItemConfig } from "./usePostsItem";
import { SECTION_WIDTH } from "../common/SingleColumnSection";
import withErrorBoundary from "../common/withErrorBoundary";
import classNames from "classnames";
import { InteractionWrapper, useClickableCell } from "../common/useClickableCell";

export const styles = (theme: ThemeType) => ({
  root: {
    display: "flex",
    alignItems: "center",
    justifyContent: "space-between",
    maxWidth: SECTION_WIDTH,
    marginBottom: "12px",
  },
  readCheckbox: {
    minWidth: 24,
    [theme.breakpoints.down("xs")]: {
      marginLeft: -12,
    },
  },
  expandedCommentsWrapper: {
    display: "flex",
    flexDirection: "column",
    minWidth: "100%",
    maxWidth: "100%",
    background: theme.palette.grey[0],
    border: `1px solid ${theme.palette.grey[100]}`,
    borderRadius: theme.borderRadius.default,
    "&:hover": {
      background: theme.palette.grey[50],
      border: `1px solid ${theme.palette.grey[250]}`,
    },
    "&:hover .PostsItemTrailingButtons-actions": {
      opacity: 0.2,
    },
    "&:hover .PostsItemTrailingButtons-archiveButton": {
      opacity: 0.2,
    },
  },
  container: {
    position: "relative",
    flexGrow: 1,
    flexWrap: "wrap",
    maxWidth: "100%",
    display: "flex",
    alignItems: "center",
    paddingTop: "8px",
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontWeight: 500,
    fontSize: 13,
    color: theme.palette.text.dim65,
    cursor: "pointer",
  },
  postsVote: {
    position: "relative",
    fontSize: 30,
    textAlign: "center",
    "& .PostsVoteDefault-voteBlock": {
      marginTop: -5,
    },
  },
  tagRelWrapper: {
    position: "relative",
    transform: "translateY(1px)",
    marginLeft: 44,
    marginRight: 14,
  },
  details: {
    flexGrow: 1,
    minWidth: 0, // flexbox black magic
    flexBasis: "50%",
  },
  titleWrapper: {
    display: "inline",
  },
  title: {
    fontWeight: 600,
    fontSize: 16,
    fontFamily: theme.palette.fonts.sansSerifStack,
    marginBottom: 2,
    [theme.breakpoints.up("sm")]: {
      display: "flex",
      maxWidth: "100%",
    },
    [theme.breakpoints.down("xs")]: {
      display: "-webkit-box",
      "-webkit-box-orient": "vertical",
      "-webkit-line-clamp": 3,
    },
  },
  meta: {
    display: "flex",
    alignItems: "center",
    whiteSpace: "nowrap",
    paddingBottom: "10px",
  },
  secondaryContainer: {
    display: "flex",
    alignItems: "center",
    marginTop: -9,
  },
  audio: {
    marginLeft: 6,
    "& svg": {
      height: 13,
      margin: "3px -8px 0 3px",
    },
  },
  tag: {
    margin: "0 5px 0 15px",
  },
  comments: {
    minWidth: 58,
    marginLeft: 4,
    display: "flex",
    alignItems: "center",
    "& svg": {
      height: 18,
      marginRight: 1,
    },
    "&:hover": {
      color: theme.palette.grey[800],
      opacity: 1,
    },
    [theme.breakpoints.up("sm")]: {
      padding: '10px 0',
    }
  },
  newComments: {
    fontWeight: 700,
    color: theme.palette.grey[1000],
  },
  postActions: {
    minWidth: 20,
    marginLeft: -5,
    paddingRight: 16,
    "& .PostActionsButton-icon": {
      fontSize: 20,
    },
    "&:hover .PostActionsButton-icon": {
      color: theme.palette.grey[700],
    },
  },
  hideOnMobile: {
    [theme.breakpoints.down("xs")]: {
      display: "none",
    },
  },
  onlyMobile: {
    [theme.breakpoints.up("sm")]: {
      display: "none",
    },
  },
  expandedComments: {
    padding: "0 12px 8px",
  },
  interactionWrapper: {
    "&:hover": {
      opacity: 1,
    },
  },
  karmaDisplay: {
    width: 50,
    minWidth: 50,
  },
  contentPreviewContainer: {
    padding: "20px 50px",
    flexBasis: "100%",
    backgroundColor: theme.palette.grey[100],
    borderTop: `1px solid ${theme.palette.grey[250]}`,
  },
});

export type EAPostsItemProps = PostsItemConfig & {
  hideSecondaryInfo?: boolean,
  classes: ClassesType<typeof styles>,
};

const EAPostsItem = ({
  hideSecondaryInfo,
  classes,
  ...props
}: EAPostsItemProps) => {
  const {
    post,
    postLink,
    tagRel,
    commentCount,
    hasUnreadComments,
    sticky,
    showDraftTag,
    showAuthorTooltip,
    showPersonalIcon,
    showTrailingButtons,
    showMostValuableCheckbox,
    showDismissButton,
    onDismiss,
    onArchive,
    resumeReading,
    strikethroughTitle,
    curatedIconLeft,
    showIcons,
    isRead,
    showReadCheckbox,
    tooltipPlacement,
    toggleComments,
    renderComments,
    commentTerms,
    condensedAndHiddenComments,
    isRepeated,
    analyticsProps,
    isVoteable,
    hideContentPreviewIfSticky,
    className,
  } = usePostsItem(props);

  // We save the scroll position when the user clicks on a post so we can restore their position in the infinite scroll
  // if they click back from this post later. The other variable needed to save infinite scroll state is the number of
  // posts loaded, which in usePostsList is the `limit` variable returned by useMulti. Beware that that is not the same
  // as the props.terms.limit variable we have here, so saving infinite scroll state must be done partly here, and partly
  // in usePostsList.
  const {onClick: clickableCellOnclick} = useClickableCell({href: postLink});
  const onClick = (e: MouseEvent<HTMLDivElement>) => {
    const infiniteScrollPosition = JSON.stringify({
      href: window.location.href,
      scrollPosition: window.scrollY,
    })
    localStorage.setItem('infiniteScrollPosition', infiniteScrollPosition);

    clickableCellOnclick(e)
  }

  if (isRepeated) {
    return null;
  }

  const {
    PostsTitle, ForumIcon, PostActionsButton, EAKarmaDisplay, EAPostMeta,
    PostsItemTagRelevance, PostsItemTooltipWrapper, PostsVote,
    PostsItemTrailingButtons, PostReadCheckbox, PostsItemNewCommentsWrapper, PostsHighlight
  } = Components;

  const SecondaryInfo = () => hideSecondaryInfo ? null : (
    <>
      <InteractionWrapper className={classes.interactionWrapper}>
        <a onClick={toggleComments} className={classNames(
          classes.comments,
          {[classes.newComments]: hasUnreadComments},
        )}>
          <ForumIcon icon="Comment" />
          {commentCount}
        </a>
      </InteractionWrapper>
      <div className={classes.postActions}>
        <InteractionWrapper className={classes.interactionWrapper}>
          <PostActionsButton post={post} popperGap={16} autoPlace vertical />
        </InteractionWrapper>
      </div>
      {/* Tags (topics) are removed for launch, but will be added back later, so I'm leaving this commented out. */}
      {/*tagRel &&
        <div className={classes.tagRelWrapper}>
          <InteractionWrapper className={classes.interactionWrapper}>
            <PostsItemTagRelevance tagRel={tagRel} />
          </InteractionWrapper>
        </div>
      */}
    </>
  );


  const showContents = !(sticky && hideContentPreviewIfSticky) && (post?.contents?.wordCount ?? 0)  > 1
  
  return (
    <AnalyticsContext {...analyticsProps}>
      <div className={classNames(classes.root, className)}>
        {showReadCheckbox &&
          <div className={classes.readCheckbox}>
            <PostReadCheckbox post={post} width={14} />
          </div>
        }
        <div className={classes.expandedCommentsWrapper}>
          <div className={classes.container} onClick={onClick}>
            {isVoteable
              ? (
                <InteractionWrapper className={classNames(
                  classes.interactionWrapper,
                  classes.postsVote,
                )}>
                  <PostsVote post={post} />
                </InteractionWrapper>
              )
              : (
                <EAKarmaDisplay post={post} className={classes.karmaDisplay} />
              )
            }
            <div className={classes.details}>
              <PostsTitle
                {...{
                  post,
                  sticky,
                  showDraftTag,
                  showPersonalIcon,
                  strikethroughTitle,
                  curatedIconLeft,
                  showIcons,
                }}
                read={isRead && !showReadCheckbox}
                isLink={true}
                className={classes.title}
              />
              <div className={classes.meta}>
                <EAPostMeta post={post} showAuthorTooltip={showAuthorTooltip} />
                <div className={classNames(
                  classes.secondaryContainer,
                  classes.onlyMobile,
                )}>
                  <SecondaryInfo />
                </div>
              </div>
            </div>
            <div className={classNames(classes.secondaryContainer, classes.hideOnMobile)}>
              {/*
                * This is commented out for now as we'll likely experiment with
                * adding it back in the future
              <div className={classes.tag}>
                {primaryTag && !showReadCheckbox &&
                  <FooterTag tag={primaryTag} smallText />
                }
              </div>
                */}
              <SecondaryInfo />
            </div>
            <InteractionWrapper className={classes.interactionWrapper}>
              <PostsItemTrailingButtons
                showArchiveButton={false}
                {...{
                  post,
                  showTrailingButtons,
                  showMostValuableCheckbox,
                  showDismissButton,
                  resumeReading,
                  onDismiss,
                  onArchive,
                }}
              />
            </InteractionWrapper>
            {showContents && <div className={classes.contentPreviewContainer}>
                <PostsHighlight post={post} maxLengthWords={50} smallerFonts={false} />
              </div>
            }
          </div>
          {renderComments &&
            <div className={classes.expandedComments}>
              <PostsItemNewCommentsWrapper
                terms={commentTerms}
                post={post}
                treeOptions={{
                  highlightDate: post.lastVisitedAt,
                  condensed: condensedAndHiddenComments,
                }}
              />
            </div>
          }
        </div>
      </div>
    </AnalyticsContext>
  );
}

const EAPostsItemComponent = registerComponent(
  "EAPostsItem",
  EAPostsItem,
  {
    styles,
    stylePriority: 1,
    hocs: [withErrorBoundary],
    areEqual: {
      terms: "deep",
    },
  },
);

declare global {
  interface ComponentTypes {
    EAPostsItem: typeof EAPostsItemComponent
  }
}
