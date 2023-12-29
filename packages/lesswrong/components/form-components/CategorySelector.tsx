import React, {useCallback} from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import mapValues from 'lodash/mapValues'
import toDictionary from '../../lib/utils/toDictionary.ts'

const styles = (_theme: ThemeType): JssStyles => ({
  root: {
    display: 'flex',
    flexDirection: 'column',
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

const CategorySelector = ({
                            value,
                            path,
                            document,
                            formType,
                            updateCurrentValues,
                            placeholder,
                            classes,
                          }: FormComponentProps<any> & {
  classes: ClassesType,
}) => {
  const {
    SingleTagItem,
    CoreTagsChecklist,
    Typography,
  } = Components
  // somehow creating the admin tag fucked up the ability to display the below component (in fact it crashes the whole page)
  // I failed to remove the tag I create in sufficient detail so far
  // return <div className={classes.root}/>

  const selectedTagIds = Object.keys(value || {})

  /**
   * post tagRelevance field needs to look like {string: number}
   */
  const updateValuesWithArray = useCallback((arrayOfTagIds: string[]) => {
    void updateCurrentValues(
      mapValues(
        {tagRelevance: arrayOfTagIds},
        (arrayOfTagIds: string[]) => toDictionary(
          arrayOfTagIds, tagId => tagId, () => 1,
        ),
      ),
    )
  }, [updateCurrentValues])

  const onTagSelected = useCallback(async (
    tag: { tagId: string, tagName: string, parentTagId?: string },
    existingTagIds: string[],
  ) => {
    updateValuesWithArray(
      [
        tag.tagId,
        ...existingTagIds,
      ].filter(Boolean) as string[],
    )
  }, [updateValuesWithArray])

  const onTagRemoved = useCallback((tagId: string) =>
      updateValuesWithArray(selectedTagIds.filter((thisTagId) => thisTagId !== tagId)),
    [updateValuesWithArray, selectedTagIds],
  )

  const selectedCategory = selectedTagIds?.[0]

  return <div className={classes.root}>
    <Typography variant={'body2'} className={classes.sectionDescription}>Choose a Category</Typography>
    {selectedCategory ?
      <SingleTagItem
        key={selectedCategory}
        documentId={selectedCategory}
        onDelete={(_: string) => onTagRemoved(selectedCategory)}
      /> : <div>
        <CoreTagsChecklist onTagSelected={onTagSelected}/>
      </div>}
  </div>
}

const CategorySelectorComponent = registerComponent('CategorySelector', CategorySelector, {styles})

declare global {
  interface ComponentTypes {
    CategorySelector: typeof CategorySelectorComponent
  }
}
