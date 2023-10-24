import React from 'react';
import { Components, registerComponent } from '../../../lib/vulcan-lib';
import { postGetPageUrl } from '../../../lib/collections/posts/helpers';
import { forumTitleSetting } from '../../../lib/instanceSettings';
import { useMessages } from '../../common/withMessages';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';
import Paper from '@material-ui/core/Paper';
import { useTracking } from '../../../lib/analyticsEvents';
import { isFriendlyUI } from '../../../themes/forumTheme';
import { showSocialMediaShareLinksSetting } from '../../../lib/publicSettings';

const styles = (theme: ThemeType): JssStyles => ({
  icon: {
    height: 20,
    fill: "currentColor",
  },
})

const SharePostActions = ({post, onClick, classes}: {
  post: PostsBase,
  onClick?: () => void,
  classes: ClassesType,
}) => {
  const { DropdownMenu, DropdownItem, DropdownDivider, SocialMediaIcon } = Components;
  const postUrl = postGetPageUrl(post, true);
  const { captureEvent } = useTracking()
  const { flash } = useMessages();
  
  const copyLink = () => {
    captureEvent('sharePost', {option: 'copyLink'})
    void navigator.clipboard.writeText(postUrl);
    flash("Link copied to clipboard");
  }

  const openLinkInNewTab = (url: string) => {
    window.open(url, '_blank');
  }
  
  const siteName = forumTitleSetting.get();
  const linkTitle = `${post.title} - ${siteName}`;
  
  const shareToTwitter = () => {
    captureEvent('sharePost', {option: 'twitter'})
    const tweetText = `${linkTitle} ${postUrl}`;
    const destinationUrl = `https://twitter.com/intent/tweet?text=${encodeURIComponent(tweetText)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToFacebook = () => {
    captureEvent('sharePost', {option: 'facebook'})
    const destinationUrl = `https://www.facebook.com/sharer/sharer.php?u=${encodeURIComponent(postUrl)}&t=${encodeURIComponent(linkTitle)}`;
    openLinkInNewTab(destinationUrl);
  }
  const shareToLinkedIn = () => {
    captureEvent('sharePost', {option: 'linkedIn'})
    const destinationUrl = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(postUrl)}`;
    openLinkInNewTab(destinationUrl);
  }

  return <Paper onClick={onClick}>
    <DropdownMenu className={classes.root}>
      <DropdownItem
        title={preferredHeadingCase("Copy Link")}
        icon="Link"
        onClick={copyLink}
      />
      {showSocialMediaShareLinksSetting.get() && <>
        <DropdownDivider/>
        <DropdownItem
          title={isFriendlyUI ? "Share on Twitter" : "Twitter"}
          icon={() => <SocialMediaIcon className={classes.icon} name="twitter"/>}
          onClick={shareToTwitter}
        />
        <DropdownItem
          title={isFriendlyUI ? "Share on Facebook" : "Facebook"}
          icon={() => <SocialMediaIcon className={classes.icon} name="facebook"/>}
          onClick={shareToFacebook}
        />
        <DropdownItem
          title={isFriendlyUI ? "Share on LinkedIn" : "LinkedIn"}
          icon={() => <SocialMediaIcon className={classes.icon} name="linkedin"/>}
          onClick={shareToLinkedIn}
        />
      </>}
    </DropdownMenu>
  </Paper>
}

const SharePostActionsComponent = registerComponent('SharePostActions', SharePostActions, {styles});

declare global {
  interface ComponentTypes {
    SharePostActions: typeof SharePostActionsComponent
  }
}


