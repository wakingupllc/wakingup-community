import React, { useEffect, useRef, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib/components';
import { decodeIntlError } from '../../lib/vulcan-lib/utils';
import classNames from 'classnames';
import { PostsListConfig, usePostsList } from './usePostsList';
import FormattedMessage from '../../lib/vulcan-i18n/message';
import { isGenericError } from '../../lib/vulcan-lib';
import { useOnPageScroll } from '../common/withOnPageScroll'
import { isClient } from '../../lib/executionEnvironment';
import throttle from 'lodash/throttle';
import { elementIsNearVisible } from '../../lib/utils/elementIsNearVisible';

const Error = ({error}: any) => <div>
  <FormattedMessage id={error.id} values={{value: error.value}} html={isGenericError(error.message)}/>{error.message}
</div>;

const styles = (theme: ThemeType): JssStyles => ({
  itemIsLoading: {
    opacity: .4,
  },
  posts: {
    boxShadow: theme.palette.boxShadow.default,
  },
});

type PostsList2Props = PostsListConfig & {classes: ClassesType};

const throttledLoadMore = throttle((loadMore) => {
  loadMore()
}, 100)

// If they clicked the Back button to get back to the infinite scrolling homepage, we want to restore the state
// as it was before. Here, we find out how many posts we need to load. Once those posts have loaded, a useEffect
// hook calls restoreScrollPosition().
const previousInfiniteScrollLimit = function(currentView: string, defaultLimit: number) {
  if (typeof localStorage === 'undefined') return defaultLimit;

  const { view, limit, expiresAt } = JSON.parse(localStorage.getItem('infiniteScrollState') || '{}');

  if (view === currentView && expiresAt > Date.now()) {
    return limit ?? defaultLimit;
  } else {
    localStorage.removeItem('infiniteScrollState');
    return defaultLimit;
  }
}

const restoreScrollPosition = () => {
  const { scrollPosition, pathQuery } = JSON.parse(localStorage.getItem('infiniteScrollPosition') || '{}');
  if (scrollPosition && pathQuery === window.location.pathname + window.location.search) {
    localStorage.removeItem('infiniteScrollPosition');
    window.scrollTo(0, scrollPosition);
  }
}

/** A list of posts, defined by a query that returns them. */
const PostsList2 = ({classes, ...props}: PostsList2Props) => {
  const [loadedMore, setLoadedMore] = useState(false);
  // On first loading posts, we might be restoring scroll position from before, so we use previousInfiniteScrollLimit
  // which will return the limit if there is one (otherwise the default limit). For subsequent loads called by loadMore,
  // we use the limit from the props.
  const postsLimit = loadedMore ?
    props.terms.limit :
    previousInfiniteScrollLimit(props.terms.view, props.terms.limit);
  const propsWithLimit = {...props, terms: {...props.terms, limit: postsLimit}};

  const {
    children,
    showNoResults,
    showLoadMore,
    showLoading,
    dimWhenLoading,
    loading,
    topLoading,
    boxShadow,
    error,
    loadMore,
    loadMoreProps,
    maybeMorePosts,
    orderedResults,
    itemProps,
    hideContentPreviewIfSticky,
  }= usePostsList(propsWithLimit);

  // Reference to a bottom-marker used for checking scroll position.
  const bottomRef = useRef<HTMLDivElement|null>(null);

  useEffect(() => {
    if (!itemProps || itemProps.length === 0) return;

    restoreScrollPosition();
  }, [itemProps])

  // maybeStartLoadingMore: Test whether the scroll position is close enough to
  // the bottom that we should start loading the next page, and if so, start loading it.
  const maybeStartLoadingMore = () => {
    // Client side, scrolled to near the bottom? Start loading if we aren't loading already.
    if (props.infiniteScroll
      && isClient
      && bottomRef?.current
      && elementIsNearVisible(bottomRef?.current, loadMoreDistance)
      && !loading
      && orderedResults
      && showLoadMore)
    {
      setLoadedMore(true);
      throttledLoadMore(loadMore);
    }
  }

  // Load-more triggers. Check (1) after render, and (2) when the page is scrolled.
  useEffect(maybeStartLoadingMore);
  useOnPageScroll(maybeStartLoadingMore);

  const loadMoreDistance = 500;

  const { Loading, LoadMore, PostsNoResults, SectionFooter, PostsItem } = Components;

  if (!orderedResults && loading) {
    return <Loading />
  }

  if (!orderedResults?.length && !showNoResults) {
    return null
  }

  return (
    <div className={classNames({[classes.itemIsLoading]: loading && dimWhenLoading})}>
      {error && <Error error={decodeIntlError(error)} />}
      {loading && showLoading && (topLoading || dimWhenLoading) && <Loading />}
      {orderedResults && !orderedResults.length && <PostsNoResults />}

      <div className={boxShadow ? classes.posts : undefined}>
        {itemProps?.map((props) => <PostsItem key={props.post._id} {...props} hideContentPreviewIfSticky={hideContentPreviewIfSticky} />)}
      </div>
      {showLoadMore && <SectionFooter>
        <LoadMore
          {...loadMoreProps}
          loading={loading}
          loadMore={loadMore}
          hideLoading={dimWhenLoading || !showLoading}
          // It's important to use hidden here rather than not rendering the component,
          // because LoadMore has an "isFirstRender" check that prevents it from showing loading dots
          // on the first render. Not rendering resets this
          hidden={!maybeMorePosts && !loading}
          sectionFooterStyles
        />
        { children }
      </SectionFooter>}
      <div ref={bottomRef}/>
    </div>
  )
}

const PostsList2Component = registerComponent('PostsList2', PostsList2, {
  styles,
  areEqual: {
    terms: "deep",
  },
});

declare global {
  interface ComponentTypes {
    PostsList2: typeof PostsList2Component
  }
}
