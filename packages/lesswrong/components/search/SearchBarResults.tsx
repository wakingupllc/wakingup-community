import React from 'react';
import { registerComponent, Components } from '../../lib/vulcan-lib';
import { Hits, Configure, Index } from 'react-instantsearch-dom';
import { AlgoliaIndexCollectionName, getAlgoliaIndexName } from '../../lib/search/algoliaUtil';
import { Link } from '../../lib/reactRouterWrapper';
import { HEADER_HEIGHT, MOBILE_HEADER_HEIGHT } from '../common/Header';
import { SearchHitComponentProps } from './types';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    color: theme.palette.text.normal,
    transition: "opacity .1s ease-in-out",
    zIndex: theme.zIndexes.searchResults,
    width: 520,
    position: "fixed",
    right: 0,
    top: HEADER_HEIGHT,
    display: "flex",
    flexWrap: "wrap",
    [theme.breakpoints.down('sm')]: {
      width: "100%"
    },
    [theme.breakpoints.down('xs')]: {
      top: MOBILE_HEADER_HEIGHT,
    },
  },
  searchResults: {
    overflow:"scroll",
    width: "100%",
    height: "calc(100vh - 48px)",
    backgroundColor: theme.palette.panelBackground.default,
    paddingBottom: 100,
    [theme.breakpoints.up('md')]: {
      marginLeft: 20,
      boxShadow: theme.palette.boxShadow.searchResults,
      height: "calc(100vh - 64px)",
    },
  },
  list: {
    '& .ais-Hits-list':{
      paddingTop: 6,
      paddingBottom: 4,
      borderBottom: theme.palette.border.grey300,
    },
    '& .ais-Hits-list:empty':{
      display:"none"
    },
  },
  seeAll: {
    ...theme.typography.body2,
    ...theme.typography.commentStyle,
    color: theme.palette.lwTertiary.main,
    marginTop: 10,
    display: "block",
    textAlign: "center"
  },
  header: {
    cursor: "pointer",
    display:"flex",
    justifyContent:"space-between",
    alignItems: "center",
    paddingLeft: theme.spacing.unit,
    paddingRight: theme.spacing.unit,
    '& h1': {
      margin:0
    }
  },
})

const SearchBarResults = ({closeSearch, currentQuery, enableTagSearch = false, enableSequenceSearch = false, classes}: {
  closeSearch: ()=>void,
  currentQuery: string,
  enableTagSearch?: boolean,
  enableSequenceSearch?: boolean,
  classes: ClassesType
}) => {
  const { PostsSearchHit, SequencesSearchHit, UsersSearchHit, TagsSearchHit, CommentsSearchHit } = Components

  const searchTypes = [
    { type: "Users", Component: UsersSearchHit },
    { type: "Posts", Component: PostsSearchHit },
    enableTagSearch && { type: "Tags", Component: TagsSearchHit },
    { type: "Comments", Component: CommentsSearchHit },
    enableSequenceSearch && { type: "Sequences", Component: SequencesSearchHit },
  ].filter(Boolean) as Array<{
    type: AlgoliaIndexCollectionName;
    Component: React.ComponentType<Omit<SearchHitComponentProps, "classes">>;
  }>

  return <div className={classes.root}>
    <div className={classes.searchResults}>
        {searchTypes.map(({ type, Component }) => (
          <Components.ErrorBoundary key={type}>
            <div className={classes.list}>
              <Index indexName={getAlgoliaIndexName(type)}>
                <Configure hitsPerPage={3} />
                <Hits hitComponent={(props) => <Component clickAction={closeSearch} {...props} showIcon/>} />
              </Index>
            </div>
          </Components.ErrorBoundary>
        ))}
        <Link to={`/search?query=${currentQuery}`} className={classes.seeAll}>
          See all results
        </Link>
    </div>
  </div>
}

const SearchBarResultsComponent = registerComponent("SearchBarResults", SearchBarResults, {styles});

declare global {
  interface ComponentTypes {
    SearchBarResults: typeof SearchBarResultsComponent
  }
}
