import React, { useRef, useState } from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import withErrorBoundary from '../common/withErrorBoundary';
import classNames from 'classnames';
import { useTracking } from '../../lib/analyticsEvents';
import { postGetPageUrl } from '../../lib/collections/posts/helpers';
import { useMessages } from '../common/withMessages';
import { showSocialMediaShareLinksSetting } from '../../lib/publicSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: "inline-block",
  },
  icon: {
    fontSize: 22,
    cursor: "pointer",
    '&:hover': {
      opacity: '0.5'
    }
  },
})

const SharePostButton = ({
  post,
  className,
  classes,
}: {
  post: PostsBase,
  className?: string,
  classes: ClassesType,
}) => {
  const anchorEl = useRef<HTMLDivElement | null>(null)
  const [isOpen, setIsOpen] = useState<boolean>(false)
  const { captureEvent } = useTracking()
  const { flash } = useMessages();

  const handleClick = () => {
    if (showSocialMediaShareLinksSetting.get()) {
      shareClicked()
    } else {
      copyLink()
    }
  }

  const shareClicked = () => {
    captureEvent('sharePostButtonClicked')
    // navigator.canShare will be present on mobile devices with sharing-intents,
    // absent on desktop.
    if (!!navigator.canShare) {
      const sharingOptions = {
        title: post.title,
        text: post.title,
        url: postGetPageUrl(post),
      }
      if (navigator.canShare(sharingOptions)) {
        void navigator.share(sharingOptions)
        return
      }
    }
    setIsOpen(!isOpen)
  }

  const copyLink = () => {
    captureEvent('sharePost', {option: 'copyLink'})
    const postUrl = postGetPageUrl(post, true);
    void navigator.clipboard.writeText(postUrl);
    flash("Link copied to clipboard");
  }

  const {LWTooltip, ForumIcon, PopperCard, LWClickAwayListener, SharePostActions} = Components

  return <div className={classes.root}>
    <div ref={anchorEl}>
      <LWTooltip title="Copy Link" placement="bottom-start" disabled={isOpen}>
        <ForumIcon
          icon="Link"
          className={classNames(classes.icon, className)}
          onClick={handleClick}
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
        <SharePostActions post={post} onClick={() => setIsOpen(false)} />
      </LWClickAwayListener>
    </PopperCard>
  </div>
}

const SharePostButtonComponent = registerComponent('SharePostButton', SharePostButton, {
  styles,
  hocs: [withErrorBoundary],
});

declare global {
  interface ComponentTypes {
    SharePostButton: typeof SharePostButtonComponent
  }
}
