import React, { useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import Paper from '@material-ui/core/Paper';
import { useTracking } from '../../lib/analyticsEvents';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useMessages } from '../common/withMessages';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
  },
  icon: {
    fontSize: "1.2rem",
    verticalAlign: "top",
    color: theme.palette.icon.dim,
    margin: "0 4px",
    position: "relative",
    top: 1,
    cursor: "pointer",
  },
})

const ShareCommentButton = ({
  comment,
  post,
  className,
  classes,
}: {
  comment: CommentsList | CommentsListWithParentMetadata,
  post: PostsMinimumInfo,
  className?: string,
  classes: ClassesType,
}) => {
  const { flash } = useMessages();
  const { captureEvent } = useTracking()

  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)

  const {LWTooltip, ForumIcon, PopperCard, LWClickAwayListener, DropdownMenu, DropdownItem} = Components

  const commentUrl = post ? postGetPageUrl(post, true) + `?commentId=${comment._id}` : '';

  const copyLink = () => {
    captureEvent('shareComment', {option: 'copyLink'})
    void navigator.clipboard.writeText(commentUrl);
    flash("Link copied to clipboard");
  }

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <LWTooltip title="Share comment" placement="bottom-start" disabled={isOpen}>
        <ForumIcon
          icon="Link"
          className={classNames(classes.icon, className)}
          onClick={() => setIsOpen(!isOpen)}
        />
      </LWTooltip>
    </div>
    <PopperCard
      open={isOpen}
      anchorEl={anchorEl.current}
      placement="bottom"
      allowOverflow
    >
      <LWClickAwayListener onClickAway={() => setIsOpen(false)}>
        <Paper onClick={() => setIsOpen(!isOpen)}>
          <DropdownMenu className={classes.root}>
            <DropdownItem
              title="Copy Link"
              icon="Link"
              onClick={copyLink}
            />
          </DropdownMenu>
        </Paper>
      </LWClickAwayListener>
    </PopperCard>
  </div>
}

const ShareCommentButtonComponent = registerComponent('ShareCommentButton', ShareCommentButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    ShareCommentButton: typeof ShareCommentButtonComponent
  }
}
