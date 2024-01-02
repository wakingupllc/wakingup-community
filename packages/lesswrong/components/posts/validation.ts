import {useState} from 'react'
import {categoriesEnabledSetting} from '../../lib/instanceSettings.ts'
import isEqual from 'lodash/isEqual'

export const getPostValidationErrors = (post: PostsPage) => {
  const message = []
  if (!post.title?.length) {
    message.push({message: 'Please add a post title.'})
  }
  if (categoriesEnabledSetting.get() && !Object.keys(post.tagRelevance ?? {}).length) {
    message.push({message: 'Please select a category for your post.'})
  }
  return message
}

export const useValidatePost = () => {
  const [isValidationReady, setIsValidationReady] = useState(false)
  const [validationErrors, setValidationErrors] =
    useState<{ message: string }[]>([])

  const validate = (post: PostsPage) => {
    const newValidationErrors = getPostValidationErrors(post)
    // See https://github.com/wakingupllc/wakingup-community/pull/198#issuecomment-1873032657 for context of the check
    // TLDR is to avoid React thinking the state has changed when it hasn't, which prevents form submission
    if (!isEqual(validationErrors, newValidationErrors)) {
      setValidationErrors(newValidationErrors)
    }
    
    setIsValidationReady(true)
  }
  return [validationErrors, validate, isValidationReady] as const
}
