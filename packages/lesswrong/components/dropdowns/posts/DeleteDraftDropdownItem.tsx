import { registerComponent, Components } from '../../../lib/vulcan-lib';
import { useUpdate } from '../../../lib/crud/withUpdate';
import React, { useCallback } from 'react';
import { postCanDelete } from '../../../lib/collections/posts/helpers';
import { useCurrentUser } from '../../common/withUser';
import { preferredHeadingCase } from '../../../themes/forumTheme';
import { useMessages } from '../../common/withMessages';
import { useNavigate } from '../../../lib/routeUtil';
import { userGetProfileUrl } from '../../../lib/collections/users/helpers';

const DeleteDraftDropdownItem = ({ post }: {
  post: PostsBase
}) => {
  const { flash } = useMessages();
  const navigate = useNavigate();
  const currentUser = useCurrentUser();
  const {mutate: updatePost} = useUpdate({
    collectionName: "Posts",
    fragmentName: 'PostsList',
  });
  const {DropdownItem} = Components;

  const handleDelete = useCallback(() => {
    if (confirm("Are you sure you want to delete this post?")) {
      void updatePost({
        selector: {_id: post._id},
        data: {deletedDraft:true, draft: true}
      })
      flash({messageString: "Post deleted", type: "success"});
      if (!currentUser?.isAdmin) {
        navigate(userGetProfileUrl(currentUser))
      }
    }
  }, [post, updatePost, flash, navigate, currentUser])

  if (currentUser && postCanDelete(currentUser, post)) {
    return (
      <DropdownItem
        title={preferredHeadingCase("Delete Post")}
        onClick={handleDelete}
      />
    );
  } else {
    return null
  }
}

const DeleteDraftDropdownItemComponent = registerComponent(
  'DeleteDraftDropdownItem',
  DeleteDraftDropdownItem,
);

declare global {
  interface ComponentTypes {
    DeleteDraftDropdownItem: typeof DeleteDraftDropdownItemComponent
  }
}
