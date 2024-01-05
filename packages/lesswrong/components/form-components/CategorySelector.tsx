import React, {useCallback} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useUpdateTagValuesWithArray} from './FormComponentPostEditorTagging'
import {categoryStyle} from './CategoryItem'
import {canVoteOnTag} from '../../lib/voting/tagRelVoteRules'
import {useCurrentUser} from '../common/withUser'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
    '& .TagsChecklist-tag': {
      opacity: 1,
      ...categoryStyle(theme),
      backgroundColor: theme.palette.tag.coreTagBackground,
    },
  },
  sectionDescription: {
    marginBottom: '1em',
    '&::after': {
      content: '"*"',
      color: 'red',
      marginLeft: '0.2em',
    },
  },
})

const CategorySelector = (
  {
    value,
    updateCurrentValues,
    document,
    classes,
  }: FormComponentProps<Record<string, number> | null> & {
    classes: ClassesType,
  }) => {
  const updateValuesWithArray = useUpdateTagValuesWithArray(updateCurrentValues)
  const user = useCurrentUser()

  const {
    CategoryItem,
    CoreTagsChecklist,
    Typography,
  } = Components
  const selectedTagIds = Object.keys(value || {})

  const onTagSelected = useCallback(async (
    tag: { tagId: string, tagName: string, parentTagId?: string },
    existingTagIds: string[],
  ) => {
    updateValuesWithArray([tag.tagId, ...existingTagIds])
  }, [updateValuesWithArray])

  const onTagRemoved = useCallback((tagId: string) =>
      updateValuesWithArray(selectedTagIds.filter((thisTagId) => thisTagId !== tagId)),
    [updateValuesWithArray, selectedTagIds],
  )

  const selectedCategory = selectedTagIds?.[0]

  return <div className={classes.root}>
    <Typography variant={'body2'} className={classes.sectionDescription}>Choose a Category</Typography>
    {selectedCategory ?
      <CategoryItem
        key={selectedCategory}
        documentId={selectedCategory}
        onDelete={(_: string) => onTagRemoved(selectedCategory)}
      /> : <div>
        <CoreTagsChecklist 
          onTagSelected={onTagSelected} 
          shouldDisplayTag={(tag) => !canVoteOnTag(tag.canVoteOnRels, user, document, 'smallUpvote').fail}
        />
      </div>}
  </div>
}

const CategorySelectorComponent = registerComponent('CategorySelector', CategorySelector, {styles})

declare global {
  interface ComponentTypes {
    CategorySelector: typeof CategorySelectorComponent
  }
}
