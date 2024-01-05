import React, {useMemo, useState} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useCurrentUser} from '../common/withUser'
import {useLocation, useNavigate} from '../../lib/routeUtil'
import {AnalyticsContext} from '../../lib/analyticsEvents'
import {categoriesEnabledSetting, isLW, isLWorAF} from '../../lib/instanceSettings'
import {sectionTitleStyle} from '../common/SectionTitle'
import {AllowHidingFrontPagePostsContext} from '../dropdowns/posts/PostActions'
import {HideRepeatedPostsProvider} from '../posts/HideRepeatedPostsContext'
import classNames from 'classnames'
import {reviewIsActive} from '../../lib/reviewUtils'
import {isFriendlyUI} from '../../themes/forumTheme'
import type {Option} from '../common/InlineSelect'
import {getPostViewOptions} from '../../lib/postViewOptions'
import Button from '@material-ui/core/Button'
import qs from 'qs'
import {Link} from '../../lib/reactRouterWrapper'
import {TopicsBarTab} from '../common/HomeTagBar'
import {tagPostTerms} from '../tagging/TagPage'
import {
  frontpagePostsCountSetting,
  frontpagePostsLoadMoreCountSetting,
  showPinnedPostPreviewOnHomepageSetting,
} from '../../lib/publicSettings'

const FRONTPAGE_TAB_NAME = 'All'

const titleWrapper = isLWorAF ? {
  marginBottom: 8
} : {
  display: "flex",
  marginBottom: 8,
  flexWrap: "wrap",
  alignItems: "center"
};

const styles = (theme: ThemeType): JssStyles => ({
  titleWrapper,
  title: {
    ...sectionTitleStyle(theme),
    display: "inline",
    marginRight: "auto"
  },
  toggleFilters: {
    [theme.breakpoints.up('sm')]: {
      display: "none"
    },
  },
  hide: {
      display: "none"
  },
  hideOnMobile: {
    [theme.breakpoints.down('sm')]: {
      display: "none"
    },
  },
  hideOnDesktop: {
    [theme.breakpoints.up('md')]: {
      display: "none"
    },
  },
  icon: {
    cursor: "pointer",
    color: theme.palette.grey[600],
    fontSize: 18,
    position: 'relative',
    top: '4px',
  },
  iconWithLabelGroup: {
    display: "flex",
    alignItems: "center",
    cursor: "pointer",
  },
  sortMenuContainer: {
    fontSize: "1.1rem",
    fontWeight: "450",
    lineHeight: "1.5em",
    fontFamily: theme.palette.fonts.sansSerifStack,
  },
  selectTitle: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    fontSize: "14px",
    lineHeight: "21px",
    fontWeight: 700,
    letterSpacing: "0.03em",
    color: `${theme.palette.grey[600]} !important`,
    textTransform: "uppercase",
  },
  selectTitleContainer: {
    marginBottom: 8,
  },
  noHoverLink: {
    '&:hover': {
      opacity: 1,
    },
  },
  createPostContainer: {
    borderRadius: '6px',
    backgroundColor: '#fff',
    marginBottom: '8px',
    height: 62,
    cursor: 'text',
  },
  createPostPlaceholder: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    position: 'absolute',
    left: 15,
    top: 21,
    color: theme.palette.grey[400],
    fontWeight: 600,
    fontSize: 16,
  },
  createPostButton: {
    fontFamily: theme.typography.fontFamily,
    marginLeft: "5px",
    fontSize: 14,
    fontWeight: 500,
    textTransform: "none",
    background: theme.palette.primary.main,
    position: 'absolute',
    top: 13,
    right: 15,
    color: "#fff",
  },
})

const defaultLimit = frontpagePostsCountSetting.get() ?? isFriendlyUI ? 11 : 13;

const WUHomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  const { query } = location;
  const {
    SingleColumnSection, 
    PostsList2, 
    CuratedPostsList, 
    Typography, 
    InlineSelect, 
    HomeTagBarSingleSelectedTag
  } = Components
  const navigate = useNavigate();
  const frontpageTab = useMemo(() => ({_id: '0', name: FRONTPAGE_TAB_NAME}), [])
  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)
  
  const limit = frontpagePostsCountSetting.get() ?? (parseInt(query.limit) || defaultLimit);

  const currentSorting = (query.view || currentUser?.allPostsSorting || 'magic') as PostSortingMode;
  const viewOptions = getPostViewOptions();
  const selectedOption = viewOptions.find((option) => option.value === query.view) || viewOptions[0]

  const handleViewClick = (opt: Option & {value: CommentsViewName}) => {
    const view = opt.value
    const { query } = location;
    const newQuery = {...query, view: view}
    navigate({...location.location, search: `?${qs.stringify(newQuery)}`})
  };

  const postsTerms = {
    ...query,
    ...(activeTab.name === FRONTPAGE_TAB_NAME ? {} : tagPostTerms(activeTab, {})),
    view: currentSorting,
    forum: true,
    limit:limit,
  }

  const showCurated = isFriendlyUI || (isLW && reviewIsActive())

  return (
    <AnalyticsContext pageSectionContext="latestPosts">
      <SingleColumnSection>
        <Link to={{pathname:"/newPost"}} className={classes.noHoverLink}>
          <div className={classes.createPostContainer}>
            <span className={classes.createPostPlaceholder}>
              Share your thoughts...
            </span>
            <Button
              type="button"
              className={classes.createPostButton}
              variant="contained"
              color="primary"
            >
              Create Post
            </Button>
          </div>
        </Link>
        
        {categoriesEnabledSetting.get() && <HomeTagBarSingleSelectedTag setActiveTab={setActiveTab} activeTab={activeTab} frontpageTab={frontpageTab} />}
        
        <Typography
          variant="body2"
          component='span'
          className={classNames(classes.inline, classes.selectTitleContainer)}
        >
          <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleViewClick} displayStyle={classes.selectTitle} appendChevron={true} />
        </Typography>
        
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList />}
          <AnalyticsContext pageSectionContext={"latestPosts"}>
            {/* Allow hiding posts from the front page*/}
            <AllowHidingFrontPagePostsContext.Provider value={true}>
              <PostsList2
                terms={postsTerms}
                alwaysShowLoadMore
                hideHiddenFrontPagePosts
                itemsPerPage={frontpagePostsLoadMoreCountSetting.get()}
                hideContentPreviewIfSticky={!showPinnedPostPreviewOnHomepageSetting.get()}
              >
              </PostsList2>
            </AllowHidingFrontPagePostsContext.Provider>
          </AnalyticsContext>
        </HideRepeatedPostsProvider>
      </SingleColumnSection>
    </AnalyticsContext>
  )
}

const WUHomeLatestPostsComponent = registerComponent('WUHomeLatestPosts', WUHomeLatestPosts, {styles});

declare global {
  interface ComponentTypes {
    WUHomeLatestPosts: typeof WUHomeLatestPostsComponent
  }
}
