import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useSingle} from '../../lib/crud/withSingle'

export const categoryStyle = (theme: ThemeType) => ({
  fontWeight: 400,
  fontSize: 15,
  fontFamily: theme.typography.fontFamily,
  lineHeight: 1.4,
  
  cursor: 'pointer',
  backgroundColor: theme.palette.tag.background,
  border: 'unset',
  borderRadius: 6,
  padding: '8px 12px',
  
  // for hover preview not being flush with the element
  marginBottom: 8,
  
  '&:hover': {
    backgroundColor: theme.palette.tag.backgroundHover,
    color: theme.palette.buttons.primaryDarkText,
  },
})

export const selectedCategoryStyle = (theme: ThemeType) => ({
  ...categoryStyle(theme),
  cursor: 'default',
  backgroundColor: theme.palette.tag.backgroundHover,
  color: theme.palette.buttons.primaryDarkText,

  '&:hover': {},
})

const styles = (theme: ThemeType): JssStyles => ({
  tag: {
    display: 'inline-flex',
    alignItems: 'center',
    columnGap: 10,
    width: 'fit-content',
    marginLeft: 5,
  },

  tagName: {
    ...selectedCategoryStyle(theme),
  },

  removeTag: {
    background: 'transparent',
    color: 'inherit',
    fontSize: 15,
    position: 'relative',
    minWidth: 15,
    boxSizing: 'content-box',
    display: 'flex',
    alignItems: 'center',
    marginBottom: 8,
    padding: 5,

    '&:hover': {
      opacity: 0.5,
    },

    '& svg': {
      width: 15,
      height: 15,
      strokeWidth: 2,
      stroke: 'black',
    },
  },
})

const CategoryItem = ({documentId, onDelete, classes}: {
  documentId: string,
  onDelete: (id: string) => void,
  classes: ClassesType
}) => {
  const {document, loading} = useSingle({
    documentId,
    collectionName: 'Tags',
    fragmentName: 'TagFragment',
  })

  if (loading) {
    return <Components.Loading/>
  }

  if (!document) return null

  return <div className={classes.tag}>
    <button className={classes.removeTag} onClick={() => onDelete(document._id)}>
      <Components.ForumIcon icon="Close"/>
    </button>
    <Components.LWTooltip title={document.description?.plaintextDescription}>
      <div className={classes.tagName}>{document.name}</div>
    </Components.LWTooltip>
  </div>
}

const CategoryItemComponent = registerComponent('CategoryItem', CategoryItem, {styles})

declare global {
  interface ComponentTypes {
    CategoryItem: typeof CategoryItemComponent
  }
}
