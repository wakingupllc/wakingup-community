import React, { useEffect, useMemo, useState } from 'react';
import { Components, registerComponent } from '../../lib/vulcan-lib';
import { useCurrentUser } from '../common/withUser';
import { useLocation, useNavigate } from '../../lib/routeUtil';
import { AnalyticsContext, useOnMountTracking } from '../../lib/analyticsEvents';
import { useFilterSettings } from '../../lib/filterSettings';
import { useCurrentTime } from '../../lib/utils/timeUtil';
import { isLW, isLWorAF } from '../../lib/instanceSettings';
import { sectionTitleStyle } from '../common/SectionTitle';
import { AllowHidingFrontPagePostsContext } from '../dropdowns/posts/PostActions';
import { HideRepeatedPostsProvider } from '../posts/HideRepeatedPostsContext';
import classNames from 'classnames';
import { reviewIsActive } from '../../lib/reviewUtils';
import { isFriendlyUI } from '../../themes/forumTheme';
import type { Option } from '../common/InlineSelect';
import { getPostViewOptions } from '../../lib/postViewOptions';
import Button from '@material-ui/core/Button';
import qs from 'qs'
import { Link } from '../../lib/reactRouterWrapper';
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
  tagBar: {
    marginTop: '2em',
    marginBottom: '1.5em',
    fontSize: 15,
    fontWeight: 400,
    '& .CategoryItem-removeTag': {
      backgroundColor: theme.palette.panelBackground.default,
      borderRadius: '50%',
      width: 27,
      height: 27,
      '&:hover': {
        opacity: 1,
        backgroundColor: theme.palette.tag.backgroundHover,
        '& svg': {
          stroke: theme.palette.buttons.primaryDarkText,
        }
      },
      '& svg': {
        margin: 'auto',
        width: 18,
        height: 18,
      }
    },
    '& .HomeTagBar-tabsSection': {
      marginBottom: 0,
    },
    '& .HomeTagBar-tab': {
      lineHeight: 1.4,
      padding: '8px 12px',
      fontSize: 15,
      fontWeight: 400,
      backgroundColor: theme.palette.panelBackground.default,
      '&:hover': {
        backgroundColor: theme.palette.tag.backgroundHover,
        color: theme.palette.buttons.primaryDarkText,
      }
    },
    '& .HomeTagBar-activeTab': {
      backgroundColor: theme.palette.tag.backgroundHover,
    },
    '& .HomeTagBar-arrow': {
      width: 40,
      height: 40,
      marginTop: -5,
      '&:hover svg': {
        backgroundColor: theme.palette.tag.backgroundHover,
        color: theme.palette.buttons.primaryDarkText,
      },
      '& svg': {
        width: '100%',
        height: '100%',
        color: '#000',
        background: '#fff',
        borderRadius: '50%',
        '& path': {
          strokeWidth: 0.1,
        }
      }
    },
    '& .HomeTagBar-rightArrow': {
      right: -40,
      '& svg': {
        paddingLeft: 3,
      }
    },
    '& .HomeTagBar-leftArrow': {
      left: -50,
      '& svg': {
        paddingRight: 3,
      }
    }
  }

})

const defaultLimit = frontpagePostsCountSetting.get() ?? isFriendlyUI ? 11 : 13;

const WUHomeLatestPosts = ({classes}:{classes: ClassesType}) => {
  const location = useLocation();
  const currentUser = useCurrentUser();

  const {filterSettings} = useFilterSettings()
  // While hiding desktop settings is stateful over time, on mobile the filter settings always start out hidden
  // (except that on the EA Forum/FriendlyUI it always starts out hidden)
  const [filterSettingsVisibleDesktop] = useState(isFriendlyUI ? false : !currentUser?.hideFrontpageFilterSettingsDesktop);
  const { captureEvent } = useOnMountTracking({eventType:"frontpageFilterSettings", eventProps: {filterSettings, filterSettingsVisible: filterSettingsVisibleDesktop, pageSectionContext: "latestPosts"}, captureOnMount: true})
  const { query } = location;
  const {
    SingleColumnSection, PostsList2, CuratedPostsList, Typography, InlineSelect, HomeTagBar, CategoryItem
  } = Components
  const navigate = useNavigate();
  const frontpageTab = useMemo(() => ({_id: '0', name: FRONTPAGE_TAB_NAME}), [])
  const [activeTab, setActiveTab] = useState<TopicsBarTab>(frontpageTab)

  // We need to reset the tab state if we have previously set it to a tag and then navigated back to the homepage, whether
  // via clicking the logo or clicking the remove tag button
  useEffect(() => {
    if (!query.tab) {
      setActiveTab(frontpageTab)
    }
  }, [query.tab, frontpageTab])

  const limit = frontpagePostsCountSetting.get() ?? (parseInt(query.limit) || defaultLimit);

  const now = useCurrentTime();

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
        <div className={classes.tagBar}>
          {activeTab.name === frontpageTab.name ? 
            <HomeTagBar onTagSelectionUpdated={setActiveTab} frontpageTab={frontpageTab} /> :
              <CategoryItem
                documentId={activeTab._id}
                onDelete={(_: string) => {
                  // We derive the selected tab based on the query, so we need to update the query to remove the tab
                  navigate({
                    ...location,
                    search: qs.stringify({...query, tab: undefined}),
                  }, {replace: true})}
                }
              />
          }
        </div>

        <Typography
          variant="body2"
          component='span'
          className={classNames(classes.inline, classes.selectTitleContainer)}
        >
          <InlineSelect options={viewOptions} selected={selectedOption} handleSelect={handleViewClick} displayStyle={classes.selectTitle} appendChevron={true} />
        </Typography>
        <HideRepeatedPostsProvider>
          {showCurated && <CuratedPostsList />}
          <AnalyticsContext listContext={"latestPosts"}>
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
