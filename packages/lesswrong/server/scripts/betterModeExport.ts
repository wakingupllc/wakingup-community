/* eslint-disable no-console */

import {Vulcan} from '../vulcan-lib'
import Users from '../../lib/collections/users/collection'
import {Posts} from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import {Votes} from '../../lib/collections/votes'
import { truncatise } from '../../lib/truncatise.ts'
import cheerio from 'cheerio';


/* Overview:
  Get guest token
  Get member token
  List spaces to find space names so we can generate a new name with an incremented suffix number
  Create new space
  Create the users
    (might just be one user if we're in "keenan_user_only" mode)
    (might be all users, or if we're just testing the export of specific post/s, might be just the authors of the posts and comments we're exporting)
  Create the posts
  Create the comments of the posts, recursively so that parent comments are created before their replies
  Create post votes/reactions
  Create comment votes/reactions
*/


type CreatedDocument = { documentId?: string; bmPostId?: string; error?: boolean; }

const SPACE_NAME_BASE = 'WU Test Migration';

const KEENAN_USER_ID = 'GEwYqQhauV';

const bmUserIds = new Map<string, string[]>();

const POST_POST_TYPE_ID = 'oR00uvx3sKdsgnb';
const COMMENT_POST_TYPE_ID = 'IzOjciUpA0oGTT0';

let startTime: Date;
let endTime: Date;

function formatDuration(startTime: Date, endTime: Date): { startTime: string; endTime: string; duration: string } {
  const duration: number = endTime.getTime() - startTime.getTime();

  const formattedStartTime: string = startTime.toLocaleString();
  const formattedEndTime: string = endTime.toLocaleString();

  const durationHours: number = Math.floor(duration / 3600000);
  const durationMinutes: number = Math.floor((duration % 3600000) / 60000);
  const durationSeconds: string = ((duration % 60000) / 1000).toFixed(0);

  return {
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    duration: `${durationHours} hours, ${durationMinutes} minutes, and ${durationSeconds} seconds`
  };
}

const errors: any[] = []

let spaceName: string;

const options: {
  mk_password?: string,
  keenan_user_only?: boolean
} = {};

const betterModeExport = async (
    mk_password: string,
    keenan_user_only?: boolean,
    postIdsToExport?: string[],
    ) => {
  startTime = new Date();
  errors.length = 0;

  options['mk_password'] = mk_password;
  options['keenan_user_only'] = keenan_user_only;

  const guestToken =        await getGuestToken();
  console.log('guestToken', guestToken);
  const adminToken =        await getAdminToken(guestToken);
  console.log('adminToken', adminToken);
  const spaces =            await listSpaces(adminToken);
  console.log({spaces});
  spaceName =               generateSpaceName(spaces);
  console.log({spaceName});
  const spaceId =           await initializeSpace(adminToken, spaceName);
  console.log({spaceId});

  const users =             options['keenan_user_only'] ?
                              await keenanUser() :
                              postIdsToExport ? 
                                await usersFromPosts(postIdsToExport) :
                                await wakingUpUsers();

  await createUsers(adminToken, users);

  const bmPosts =           await createPosts(adminToken, spaceId, postIdsToExport);

  console.log({bmPosts});
  const postIds =           bmPosts.map(createdPost => createdPost.documentId!);

  const comments =          await Comments.find({postId: {$in: bmPosts.map(createdPost => createdPost.documentId) }}).fetch();
  console.log({comments});

  const bmComments =        await createComments(adminToken, comments, bmPosts);
  console.log({bmComments});

  const postReactions =     await addReactions(adminToken, "Posts", postIds, bmPosts);
  console.log({postReactions});
  const commentReactions =  await addReactions(adminToken, "Comments", comments.map(c => c._id), bmComments);
  console.log({commentReactions});

  endTime = new Date();
  console.log('####################')
  console.log(errors)
  console.log(`${errors.length} errors`)
  console.log(`Migration to ${spaceName} complete`);
  console.log('')

  const timeDetails = formatDuration(startTime, endTime);
  console.log(`Start Time: ${timeDetails.startTime}`);
  console.log(`End Time: ${timeDetails.endTime}`);
  console.log(`Duration: ${timeDetails.duration}`);
}

const getGuestToken = async () => {
  const query = {
    "query": "query { getTokens(networkDomain: \"waking-up-new.bettermode.io\") { accessToken role { name scopes } member { id name } } }"
  };

  const resultJson = await callBmApi(query);
  return resultJson.data.getTokens.accessToken;
};

const getAdminToken = async (guestToken: string) => {
  const query = {
    "query": `mutation { loginNetwork(input: { usernameOrEmail: "michael.keenan@gmail.com", password: "${options['mk_password']}" }) { accessToken role { name scopes } member { id name } } }`
  };
  
  const resultJson = await callBmApi(query, guestToken);
  console.log('getAdminToken resultJson', resultJson);
  return resultJson.data.loginNetwork.accessToken;
}

const listSpaces = async (adminToken: string) => {
  const query = {
    "query": "{ spaces(limit: 1000) { nodes { id type slug name } } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  return resultJson.data.spaces.nodes.map((node: any) => node.name);
}

const generateSpaceName = (spaces: string[]) => {
  const regex = new RegExp(`${SPACE_NAME_BASE} (\\d+)`); // assumes SPACE_NAME_BASE doesn't contain any regex special characters

  let maxNumber = 0;
  spaces.forEach(space => {
    const match = space.match(regex);
    if (match) {
      const number = parseInt(match[1]);
      if (number > maxNumber) {
        maxNumber = number;
      }
    }
  });

  return `${SPACE_NAME_BASE} ${maxNumber + 1}`;
}

const initializeSpace = async (adminToken: string, name: string) => {
  const spaceId = await createSpace(adminToken, name);
  await updateSpacePostTypes(adminToken, spaceId);
  return spaceId;
}

const createSpace = async (adminToken: string, name: string) => {
  const query = {
    "query": `mutation { createSpace(input: { name: "${name}", whoCanPost: [member admin] }) { name id url } }`
  }
  try {
    const resultJson = await callBmApi(query, adminToken);
    return resultJson.data.createSpace.id;
  } catch (error) {
    errors.push(error);
    console.log('createSpace error', error);
    throw error;
  }
}

const updateSpacePostTypes = async (adminToken: string, spaceId: string) => {
  const query = {
    "query": `mutation { updateSpacePostTypes(input: [{ postTypeId: "${POST_POST_TYPE_ID}" }], spaceId: "${spaceId}" ) { postTypeId } }`
  };

  const maxAttempts = 3;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const resultJson = await callBmApi(query, adminToken);
      if (resultJson.errors) {
        // Sometimes this has an error, despite it being the same input each time
        // (except the spaceId, though the space is created the same way each
        // time). It is most perplexing.
        console.log('!!!!!!');
        console.log(resultJson.errors);
        errors.push(resultJson.errors);
        console.log("updateSpacePostTypes failed, trying again.")
        attempts++;
      } else {
        return true;
      }
    } catch (error) {
      attempts++;
      errors.push(error);
      console.log('updateSpacePostTypes error', error);
      throw error;
    }
  }

  throw "updateSpacePostTypes failed too many times";
}

const usersFromPosts = async (postIds: string[]) => {
  const posts = await Posts.find({_id: {$in: postIds}}).fetch();
  const userIds = posts.map(post => post.userId);
  const comments = await Comments.find({postId: {$in: postIds}}).fetch();
  const commentUserIds = comments.map(comment => comment.userId);
  const postVoters = await Votes.find({documentId: {$in: postIds}}).fetch();
  const postVoterIds = postVoters.map(vote => vote.userId);
  const commentVoters = await Votes.find({documentId: {$in: comments.map(comment => comment._id)}}).fetch();
  const commentVoterIds = commentVoters.map(vote => vote.userId);

  const allUserIds = userIds.concat(commentUserIds, postVoterIds, commentVoterIds);
  const uniqueUserIds = [...new Set(allUserIds)];

  const users = await Users.find({_id: {$in: uniqueUserIds}}).fetch();
  return users;
}

const wakingUpUsers = async () => {
  return await Users.find({deleted: {$ne: true}, banned: {$exists: false}}).fetch();
}

const keenanUser = async () => {
  return await Users.find({_id: KEENAN_USER_ID}).fetch();
}

const createUsers = async (adminToken: string, users: DbUser[]) => {
  for (const user of users) {
    await createUser(adminToken, user);
  }
}

const createUser = async (adminToken: string, user: DbUser) => {
  const name = user.first_name?.length && user.last_name?.length ?
    user.first_name + ' ' + user.last_name :
    null
  
  const password = passwordForTest(user);
  const spaceIndex = spaceName.match(/\d+$/);
  let suffix = 0;

  while (suffix < 100) {
    const email = mangleEmailForTest(user.email, suffix);
    const usernameParam = user.username && user.username.length >= 3 ? `username: "${user.username}WUTM${spaceIndex}-${suffix}",` : '';
    const query = {
      "query": `mutation { joinNetwork(input: { name: "${name}", ${usernameParam} email: "${email}", password: "${password}" }) { accessToken member { id locale networkId roleId teammate username email } } }`
    }
    
    const resultJson = await callBmApi(query, adminToken);
    if (resultJson.errors) {
      if (resultJson.errors.some((e: any) => e.errors.some((e2: any) => e2.message = "This username's already taken"))) {
        console.log(`createUser ${user.username}WUTM${spaceIndex}-${suffix} already taken`);
      }
      if (resultJson.errors.some((e: any) => e.errors.some((e2: any) => e2.message = "This email's already taken"))) {
        console.log(`createUser ${email} already taken`);
      }
      suffix++;
    } else {
      if (resultJson.data?.joinNetwork) {
        bmUserIds.set(user._id, resultJson.data.joinNetwork.member.id);
        return true;
      } else {
        console.log('createUser resultJson', resultJson);
        console.log({query});
        throw "no joinNetwork resultJson";
      }
    }
  }
  console.log(`createUser couldn't find a unique username for ${user.username}, id ${user._id} after 100 tries`);
  throw `createUser couldn't find a unique username for ${user.username}, id ${user._id} after 100 tries`;
}

function extractDomainPrefix(domain: string) {
  const dotIndex = domain.indexOf('.');
  if (dotIndex >= 0 && dotIndex < 3) {
    return domain.substring(0, dotIndex);
  }
  return domain.substring(0, 3);
}

// mangleEmailForTest sends all the signup emails to my spamgourmet account, using the ".0." suffix, which instructs it to accept zero of them, i.e. discard them all.
const mangleEmailForTest = (email: string|null, suffix: number) => {
  const spaceIndex = spaceName.match(/\d+$/);
  // if (!email) return `michael.keenan+noemail.${spaceIndex}-${suffix}@gmail.com`;
  if (!email) return `noemail${spaceIndex}-${suffix}.0.michaelkeenan@spamgourmet.com`;
  
  const [name, domain] = email.split('@');
  const domainPrefix = extractDomainPrefix(domain);
  // return `michael.keenan+${name}.${domainPrefix}.${spaceIndex}-${suffix}@gmail.com`;
  return `${name}.${domainPrefix}.${spaceIndex}-${suffix}.0.michaelkeenan@spamgourmet.com`;
}

const passwordForTest = (user: DbUser) => {
  return 'b3foreYouG0G0!';
}

const getUser = async (adminToken: string, userId: string) => {
  const query = {
    "query": `{ member(id: "${KEENAN_USER_ID}") { username displayName name status email id score url createdAt } }`
  };

  const resultJson = await callBmApi(query, adminToken);
  return resultJson.data.member;
}

const createPosts = async (adminToken: string, spaceId: string, postIds?: string[]) => {
  console.log({postIds})
  const posts = postIds
    ? await Posts.find({_id: {$in: postIds}}).fetch()
    : await Posts.find({baseScore: {$gte: 10}, deletedDraft: false, status: 2}).fetch();

  let createdPosts: CreatedDocument[] = [];
  // using for...of instead of forEach because forEach won't wait for the
  // setTimeout, so it'll get rate limited

  for (const post of posts) {// for (const post of posts.slice(0, 1)) {
    createdPosts.push(await createPost(adminToken, post, spaceId));
  }

  return createdPosts;
}

const createPost = async (adminToken: string, post: DbPost, spaceId: string) => {
  const title = post.title;
  const content = post.contents.html.replace(/"/g, '\\\\\\"');
  const publishedAt = post.postedAt;

  const bmUserId = options['keenan_user_only'] ?
                    bmUserIds.get(KEENAN_USER_ID) :
                    bmUserIds.get(post.userId);
  const query = {
    "query": `mutation {
      createPost(
        input: {
          postTypeId: "${POST_POST_TYPE_ID}",
          mappingFields: [
            { type: text, key: "title", value: "\\"${title}\\"" },
            { type: html, key: "content", value: "\\"${content}\\"" },
          ],
          tagNames: [],
          attachmentIds: [],
          publish: true,
          ownerId: "${bmUserId}",
          publishedAt: "${publishedAt}"
        },
        spaceId: "${spaceId}")
            { attachmentIds createdAt hasMoreContent id imageIds isAnonymous isHidden pinnedInto postTypeId repliedToIds repliesCount shortContent slug totalRepliesCount status }
    }`
  };

  const resultJson = await callBmApi(query, adminToken);

  try {
    console.log('createPost resultJson', resultJson);
    return {
      documentId: post._id,
      bmPostId: resultJson.data.createPost.id as string
    }
  } catch (e) {
    console.log("error occurred with this query", query);
    return {
      error: true,
    };
  }
}

const createComments = async (adminToken: string, comments: DbComment[], bmPosts: CreatedDocument[]) => {
  let bmComments: CreatedDocument[] = [];

  // Iterate through top-level ones (the ones with no parentCommentId);
  // after each one, recursively handle its replies (the ones with that
  // comment's id as their parentCommentId) and their replies, etc.

  for (const comment of comments) {
    if (comment.parentCommentId) continue;

    await createCommentRecursive(adminToken, comment, comments, bmPosts, bmComments);
  }

  return bmComments;
}

const parentCommentQuote = (commentId: string, comments: DbComment[]) => {
  const comment = comments.find(c => c._id === commentId);
  if (!comment) throw `no comment with id ${commentId}`;
  return truncatise(comment.contents.html.replace(/"/g, '\\\\\\"'), { TruncateBy: 'characters', TruncateLength: 50 })
            .replace(/<\/p><p>.*/, '') // if there's a paragraph break inside the truncation threshold, just take the first paragraph
            .replace(/\\*\.\.\.<\/p>$/, '...</p>') // remove trailing backslashes (so we don't cut off in the middle of an escape sequence)
            .replace(/^<p>(.*)<\/p>$/g, '<blockquote>$1</blockquote>');
}

const createCommentRecursive = async (adminToken: string, comment: DbComment, comments: DbComment[], bmPosts: CreatedDocument[], bmComments: CreatedDocument[]) => {
  if (comment!.contents.html.length === 0) {
    // This comment has no contents, which is strange but happens at least once. If it has no children, we'll skip it. If it has children, we'll give it the contents "[empty comment]" and continue.
    const commentChildren = comments.filter(c => c.parentCommentId === comment._id);
    if (commentChildren.length === 0) {
      console.log('createCommentRecursive skipping comment with no contents and no children', comment._id);
      return;
    }
  }

  const $ = cheerio.load(comment.contents.html);
  $('style').remove(); // Remove all <style> tags
  const cleanedContents = $.html()?.slice(25, -14) || ''; // slice off the <html><head></head><body> and </body></html> tags
  console.log({cleanedContents});

  const contents = cleanedContents === '' ? '[empty comment]' : cleanedContents.replace(/"/g, '\\\\\\"');

  const publishedAt = comment.postedAt;

  // This commented-out code exports the same structure as in this ForumMagnum codebase, where comments can be nested arbitrarily deeply. We're not going to do that for this BetterMode migration, and will only support one level of nesting (unless plans change).
  // const bmPostId = comment.parentCommentId ?
  //   bmComments.find(bmComment => bmComment.documentId === comment.parentCommentId)?.bmPostId :
  //   bmPosts.find(bmPost => bmPost.documentId === comment.postId)?.bmPostId;

  const bmPostId = comment.topLevelCommentId ?
    bmComments.find(bmComment => bmComment.documentId === comment.topLevelCommentId)?.bmPostId :
    bmPosts.find(bmPost => bmPost.documentId === comment.postId)?.bmPostId;

  console.log({bmPostId})

  if (!bmPostId) {
    console.log({comment})
    console.log({bmComments})
    throw `no bmPostId for ${comment._id}`;
  }

  const quotedContent = !comment.parentCommentId || comment.parentCommentId === comment.topLevelCommentId ?
    contents :
    parentCommentQuote(comment.parentCommentId, comments) + ' ' + contents;

  const bmUserId = options['keenan_user_only'] ?
                    bmUserIds.get(KEENAN_USER_ID) :
                    bmUserIds.get(comment.userId);

  const query = {
    "query": `mutation {
      createReply(
        input: {
          postTypeId: "${COMMENT_POST_TYPE_ID}",
          mappingFields: [
            { type: text, key: "content", value: "\\"${quotedContent}\\"" },
          ],
          tagNames: [],
          attachmentIds: [],
          publish: true,
          ownerId: "${bmUserId}",
          publishedAt: "${publishedAt}"
        },
        postId: "${bmPostId}")
          { id }
    }`
  };

  const resultJson = await callBmApi(query, adminToken);

  try {
    console.log('createComment resultJson', resultJson);
    if (resultJson.errors) {
      console.log('createComment errors', resultJson.errors);
      console.log(JSON.stringify(resultJson));
      console.log(resultJson.errors[0].message);
      console.log(resultJson.errors[0].errors);
      console.log(JSON.stringify(resultJson.errors[0].errors, null, 2));
      console.log('createComment query', query);
      console.log('comment id', comment._id);
      console.log('comment contents.html', comment.contents.html);
    }
    const bmCommentId = resultJson.data.createReply.id as string;

    if (!bmCommentId) {
      console.log({comment})
      throw `no bmCommentId for ${comment._id}`;
    }

    bmComments.push({
      documentId: comment._id,
      bmPostId: bmCommentId
    });

    const commentChildren = comments.filter(c => c.parentCommentId === comment._id);
    for (const commentChild of commentChildren) {
      await createCommentRecursive(adminToken, commentChild, comments, bmPosts, bmComments);
    }
  } catch (e) {
    errors.push(e);
    console.log({e})
    console.log("error occurred with this query", query);
  }
}

const addReactions = async (adminToken: string, type: string, ids: string[], bmPosts: CreatedDocument[]) => {
  if (options['keenan_user_only']) {
    console.log("keenan_user_only mode; skipping reactions")
    return;
  }

  const votes = await Votes.find({documentId: {$in: ids}, collectionName: type, cancelled: false, voteType: 'smallUpvote'}).fetch();

  const documents = type === "Posts" ?
    await Posts.find({_id: {$in: ids}}).fetch() :
    await Comments.find({_id: {$in: ids}}).fetch();

  for (const vote of votes) {
    // @ts-ignore (TypeScript is upset that it doesn't know whether it's posts or comments, but it's fine)
    const document = documents.find(d => d._id === vote.documentId);
    if (!document) {
      console.log(`no document for vote ${vote._id}, type ${type}, ids: ${ids}`);
      throw `no document for vote ${vote._id}`;
    }
    const bmPost = bmPosts.find(bmPost => bmPost.documentId === document._id);

    if (!bmPost) {
      errors.push(`no bmPost for vote ${vote._id}, type ${type}, ids: ${ids}`);
      console.log(`no bmPost for vote ${vote._id}, type ${type}, ids: ${ids}`);
      return;
    }

    await addReaction(adminToken, bmPost.bmPostId!, document, vote);
  }

}

const addReaction = async (adminToken: string, bmPostId: string, document: DbPost|DbComment, vote: DbVote) => {
  const voterId = bmUserIds.get(vote.userId);

  const query = {
    "query": `mutation {
      addReaction(
        input: {
          participantId: "${voterId}",
          reaction: "+1",
        },
        postId: "${bmPostId}")
      { status }
    }`
  };

  const resultJson = await callBmApi(query, adminToken);
  console.log({resultJson});
}

function headers(token?: string|undefined) {
  const headers = new Headers();
  headers.append("Content-Type", "application/json");
  if (token) headers.append("Authorization", `Bearer ${token}`);
  return headers
}

function requestOptions(raw: string, token?: string|undefined) {
  return {
    method: 'POST',
    headers: headers(token),
    body: raw,
    // redirect: 'follow'
  };
}

function mutationNameFromQuery(query: any) {
  const regex = /mutation\s*\{\s*([a-zA-Z]+)\(/s;
  const match = query.query.match(regex);
  const mutationName = match ? match[1] : null;
  return mutationName;

}

async function callBmApi(query: any, token?: string|undefined) {
  // If you want to bail on any error:
  // if (errors.length > 0) {
  //   console.log('Stopping due to error');
  //   console.log('!!!!!!!!!!')
  //   console.log(JSON.stringify(errors, null, 2));
  //   console.log('!!!!!!!!!!')
  //   throw 'Stopping due to errors';
  // }

  console.log('waiting a ninth of a second'); // BetterMode rate limits to 10 requests per second
  await new Promise(resolve => setTimeout(resolve, 111));

  console.log(`Running ${mutationNameFromQuery(query)}`);

  const raw = JSON.stringify(query);

  // Re-attempts are only for 502: Bad gateway errors. Other errors are not retried.  
  const maxAttempts = 5;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const response = await fetch("https://api.bettermode.com", requestOptions(raw, token));
      const result = await response.text();
      let resultJson;
      try {
        resultJson = JSON.parse(result);
      } catch (e) {
        console.log('callBmApi JSON parse error', e);
        console.log('result', result);
        if (result.startsWith('<!DOCTYPE html>') && result.includes('502: Bad gateway')) {
          attempts++;
          console.log('502: Bad gateway');
          console.log('We can just try again');
          console.log('Waiting five seconds for their server to recover');
          await new Promise(resolve => setTimeout(resolve, 5000));
          console.log('Continuing...');
          continue;
        }
        throw e;
      }
      if (resultJson.errors?.length === 1 && resultJson.errors[0]?.code === "INTERNAL_SERVER_ERROR") {
        const loggableErrors = JSON.stringify(resultJson.errors, null, 2)
        errors.push([loggableErrors, query]);
        console.log('callBmApi errors', loggableErrors);
        console.log('query', query);
        throw loggableErrors
      }

      return JSON.parse(result);
    } catch (error) {
      console.log('callBmApi error', error);
      errors.push(error);
      return {};
    }
  }
}

Vulcan.wuBetterModeExport = betterModeExport
