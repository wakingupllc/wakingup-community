import {useState} from 'react'
import {categoriesEnabledSetting} from '../../lib/instanceSettings.ts'

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
    const validationErrors = getPostValidationErrors(post)
    setValidationErrors(validationErrors)
    setIsValidationReady(true)
  }
  return [validationErrors, validate, isValidationReady] as const
}
