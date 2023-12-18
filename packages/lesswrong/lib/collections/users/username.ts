import {SimpleValidationError} from '../../vulcan-lib'
import badWords from '../../badWords.json'

export const usernameIsBadWord = (username: string) => {
  return badWords.includes(username.toLowerCase().trim()) || badWords.includes(username.toLowerCase().replace(/[0-9]/g, '').trim())
}

export const usernameIsTaken = async (userCollection: UsersCollection, currentUser: DbUser, username: string) => {
  const existingUser = await userCollection.findOne({username})
  return existingUser && existingUser._id !== currentUser._id
}

export const assertUsernameIsNotTaken = async (userCollection: UsersCollection, currentUser: DbUser, username: string) => {
  if (await usernameIsTaken(userCollection, currentUser, username)) {
    throw new SimpleValidationError({
      message: 'Sorry, that username is already taken.',
      data: {path: 'username'},
    })
  }
}

export const validateName = (name: string | null, field: string) => {
  if (!name) return

  if (usernameIsBadWord(name)) {
    throw new SimpleValidationError({
      message: 'Sorry, that username isn\'t allowed. Please try another.',
      data: {path: field},
    })
  }
}
