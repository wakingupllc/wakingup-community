import {Components, registerComponent} from '../../lib/vulcan-lib'
import React from 'react'
import type {Hit} from 'react-instantsearch-core'
import {showKarmaSetting} from '../../lib/publicSettings.ts'

const styles = (theme: ThemeType): JssStyles => ({
  root: {},
})

const ExpandedPostsSearchHit = ({hit, showKarma = showKarmaSetting.get, classes}: {
  hit: Hit<any>,
  showKarma?: () => boolean,
  classes: ClassesType,
}) => {

  const {PostsItem} = Components
  const post: SearchPost = hit

  /**
   * Very hacky way to reuse PostsItem by reshaping the SearchPost into a Post (with a lot of missing fields).
   * context: https://wakingup-vlad.slack.com/archives/C05MHUVM2SY/p1698969015310619
   */
  return <PostsItem
    post={{
      ...post,
      contents: {_id: post._id, htmlHighlight: post.body, wordCount: getWordCount(post), version: ''},
      // @ts-ignore
      user: {slug: post.authorSlug, displayName: post.authorDisplayName, _id: post.userId},
      __typename: 'Post',
    }}
    showKarma={showKarma()}
    hideTag={true}
    show
    showAuthorTooltip={false}
  />
}

const getWordCount = (post: SearchPost) => 
  post.body?.trim()?.split(/\s+/g)?.length ?? 0

const ExpandedPostsSearchHitComponent = registerComponent('ExpandedPostsSearchHit', ExpandedPostsSearchHit, {styles})

declare global {
  interface ComponentTypes {
    ExpandedPostsSearchHit: typeof ExpandedPostsSearchHitComponent
  }
}

