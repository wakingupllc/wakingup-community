import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import React, { useCallback } from 'react';
import { canUserEditPostMetadata } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../lib/forumTypeUtils';

const MoveToDraftDropdownItem = ({ post }: {
  post: PostsBase
}) => {
  const currentUser = useCurrentUser();
  const {DropdownItem} = Components;
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsListWithVotes',
  });

  const handleMoveToDraftDropdownItem = useCallback(() => {
    void updatePost({
      selector: {_id: post._id},
      data: {draft:true}
    })
  }, [updatePost, post])

  if (!post.draft && currentUser && canUserEditPostMetadata(currentUser, post)) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Move to Draft")}
        onClick={handleMoveToDraftDropdownItem}
        icon={"Document"}
      />
    );
  } else {
    return null
  }
}

const MoveToDraftDropdownItemComponent = registerComponent(
  'MoveToDraftDropdownItem',
  MoveToDraftDropdownItem,
);

declare global {
  interface ComponentTypes {
    MoveToDraftDropdownItem: typeof MoveToDraftDropdownItemComponent
  }
}
