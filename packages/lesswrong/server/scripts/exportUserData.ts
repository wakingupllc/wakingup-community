import {Vulcan} from '../vulcan-lib'
import Users from '../../lib/collections/users/collection'
import {Posts} from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import {Votes} from '../../lib/collections/votes'
import {htmlToTextDefault} from '../../lib/htmlToText.ts'
import {writeFile} from 'fs/promises'
import { Parser } from '@json2csv/plainjs';

const exportUserData = async ({email}: { email: string }) => {
  const user = await Users.findOne({email})
  if (!user) throw new Error(`No user found with email ${email}`)

  const userData = {
    user: formatUserData(user),
    posts: await getUserPosts(user),
    comments: await getUserComments(user),
  }

  // eslint-disable-next-line no-console
  console.log('Exported user data:', userData)
  
  await writeFile(`${email}_profile.csv`, new Parser().parse([formatUserData(user)]))
  await writeFile(`${email}_posts.csv`, new Parser().parse(userData.posts))
  await writeFile(`${email}_comments.csv`, new Parser().parse(userData.comments))
}

const formatUserData = (user: DbUser) => ({
  displayName: user.displayName,
  firstName: user.first_name,
  lastName: user.last_name,
  email: user.email,
  joinedCommunity: user.createdAt,
  wakingUpMemberSince: user.wu_created_at,
  city: user.mapLocation?.formatted_address,
  bio: formatContent(user.biography?.html),
})

const getUserPosts = async (user: DbUser) => {
  const posts = await Posts.find({userId: user._id}).fetch()
  return Promise.all(posts.map(formatPost))
}

const getUserComments = async (user: DbUser) => {
  const comments = await Comments.find({userId: user._id}).fetch()
  return Promise.all(comments.map(formatComment))
}

const formatPost = async (post: DbPost) => ({
  date: post.postedAt,
  title: post.title,
  body: formatContent(post.contents?.html),
  comments: post.commentCount,
  upvotes: await getUpvotes(post),
})

export const getUpvotes = async (voteable: DbPost | DbComment) =>
  await Votes.find({
    documentId: voteable._id,
    cancelled: false,
    voteType: {$in: ['smallUpvote', 'bigUpvote']},
  }).count()

const formatComment = async (comment: DbComment) => ({
  date: comment.postedAt,
  body: formatContent(comment.contents?.html),
  postName: (await Posts.findOne(comment.postId))?.title,
  upvotes: await getUpvotes(comment),
})

const formatContent = (content: string) => {
  if (!content) return ''
  return htmlToTextDefault(content)
}

Vulcan.wuExportUserData = exportUserData
