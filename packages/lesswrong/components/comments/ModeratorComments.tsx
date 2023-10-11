import React from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useMulti } from '../../lib/crud/withMulti';
import { sectionTitleStyle } from '../common/SectionTitle';
import { useCurrentUser } from '../common/withUser';

const styles = (theme: ThemeType): JssStyles =>  ({
  root: {
    [theme.breakpoints.up('sm')]: {
      marginRight: theme.spacing.unit*4,
    }
  },
  title: {
    marginBottom: 8,
    ...sectionTitleStyle(theme),
  },
})


const ModeratorComments = ({classes, terms={view: "moderatorComments"}, truncated=true, noResultsMessage="No Comments Found"}: {
  classes: ClassesType,
  terms: CommentsViewTerms,
  truncated?: boolean,
  noResultsMessage?: string,
}) => {
  const { CommentsNode, Loading, LoadMore, SingleColumnSection, Typography } = Components;

  const { loadingInitial, loadMoreProps, results } = useMulti({
    terms,
    collectionName: "Comments",
    fragmentName: 'CommentsListWithParentMetadata',
    enableTotal: false,
  });

  const currentUser = useCurrentUser()

  if(!currentUser) return <Components.Error404 />

  if (!loadingInitial && results && !results.length) {
    return (<Typography variant="body2">{noResultsMessage}</Typography>)
  }
  if (loadingInitial || !results) {
    return <Loading />
  }

  return (
    <SingleColumnSection>
      <div className={classes.title}>Moderator Comments</div>
      <div className={classes.root}>
        {results.map(comment =>
          <div key={comment._id}>
            <CommentsNode
              treeOptions={{
                condensed: false,
                post: comment.post || undefined,
                tag: comment.tag || undefined,
                showPostTitle: true,
                forceNotSingleLine: true,
              }}
              comment={comment}
              startThreadTruncated={truncated}
            />
          </div>
        )}
        <LoadMore {...loadMoreProps} />
      </div>
    </SingleColumnSection>
  )
}

const ModeratorCommentsComponent = registerComponent('ModeratorComments', ModeratorComments, {styles});

declare global {
  interface ComponentTypes {
    ModeratorComments: typeof ModeratorCommentsComponent,
  }
}

