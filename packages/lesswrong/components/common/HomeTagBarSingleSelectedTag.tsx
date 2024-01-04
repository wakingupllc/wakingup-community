import React, {useEffect} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useNavigate} from '../../lib/reactRouterWrapper'
import {useLocation} from '../../lib/routeUtil'
import qs from 'qs'
import {TopicsBarTab} from './HomeTagBar.tsx'
import {categoryStyle, selectedCategoryStyle} from '../form-components/CategoryItem'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    marginTop: '2em',
    marginBottom: '1.5em',
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
        },
      },
      '& svg': {
        margin: 'auto',
        width: 18,
        height: 18,
      },
    },
    '& .HomeTagBar-tabsSection': {
      marginBottom: 0,
    },
    '& .HomeTagBar-tab': {
      ...categoryStyle(theme),
      backgroundColor: theme.palette.panelBackground.default,
    },
    '& .HomeTagBar-activeTab': selectedCategoryStyle(theme),
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
        },
      },
    },
    '& .HomeTagBar-rightArrow': {
      right: -40,
      '& svg': {
        paddingLeft: 3,
      },
    },
    '& .HomeTagBar-leftArrow': {
      left: -50,
      '& svg': {
        paddingRight: 3,
      },
    },
  },
})
const HomeTagBarSingleSelectedTag = (
  {
    classes,
    activeTab,
    setActiveTab,
    frontpageTab,
  }: {
    classes: ClassesType,
    activeTab: TopicsBarTab,
    setActiveTab: (tab: TopicsBarTab) => void,
    frontpageTab: TopicsBarTab,
  },
) => {
  const location = useLocation()
  const {query} = location
  const navigate = useNavigate()

  // We need to reset the tab state if we have previously set it to a tag and then navigated back to the homepage, whether
  // via clicking the logo or clicking the remove tag button
  // Normally that'd be handled by HomeTagBar re-rendering, but we're unmounting it here
  useEffect(() => {
    if (!query.tab) {
      setActiveTab(frontpageTab)
    }
  }, [query.tab, frontpageTab, setActiveTab])

  const {HomeTagBar, CategoryItem} = Components

  return <div className={classes.root}>
    {activeTab.name === frontpageTab.name ?
      <HomeTagBar onTagSelectionUpdated={setActiveTab} frontpageTab={frontpageTab}/> :
      <CategoryItem
        documentId={activeTab._id}
        onDelete={(_: string) => {
          // We derive the selected tab based on the query, so we need to update the query to remove the tab
          navigate({
            ...location,
            search: qs.stringify({...query, tab: undefined}),
          }, {replace: true})
        }}
      />
    }
  </div>
}

const HomeTagBarSingleSelectedTagComponent = registerComponent('HomeTagBarSingleSelectedTag', HomeTagBarSingleSelectedTag, {styles})

declare global {
  interface ComponentTypes {
    HomeTagBarSingleSelectedTag: typeof HomeTagBarSingleSelectedTagComponent
  }
}
