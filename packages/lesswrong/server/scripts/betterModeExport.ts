/* esli-disable no-console */

import {Vulcan} from '../vulcan-lib'
import Users from '../../lib/collections/users/collection'
import {Posts} from '../../lib/collections/posts'
import { Comments } from '../../lib/collections/comments'
import {Votes} from '../../lib/collections/votes'
import { TagRels } from '../../lib/collections/tagRels/collection';
import { Tags } from '../../lib/collections/tags/collection';
import { truncatise } from '../../lib/truncatise.ts'
import cheerio from 'cheerio';
import { exec } from 'child_process';
import * as fs from 'fs';
import {CloudinaryPropsType, makeCloudinaryImageUrl} from '../../components/common/CloudinaryImage2.tsx'

const jwt = require("jsonwebtoken");
const axios = require('axios');

const secretsJson = fs.readFileSync('./exportSecrets.json').toString();
const secrets = JSON.parse(secretsJson);

const JWT_KEY = secrets['JWT_KEY'];

/* Overview of the export process:
  Get guest token
  Get member token
    (getting the guest and then member token is a prerequisite to every BetterMode GraphQL API call.)
  Delete old test users
    (though that's probably temporary and not going to be part of the actual production run)
  List spaces, to find space names with numbers at the end so we can generate a new name with an incremented suffix number
  Create new collections
  Create new spaces
    (Creating collections and spaces uses the collectionSpaces object and, importantly to note, mutates that object by adding the BM IDs for ollections and spaces to it)
  Create the users by logging them in with JWT SSO
    (If we're in "keenan_user_only" mode (useful for skipping the very long user creation process), it just creates one user)
    (might be all users, or if we're just testing the export of specific post/s, might be just the authors of the posts and comments we're exporting)
  Get the users' BM user IDs and put them in the bmUserIds map (because the JWT SSO call doesn't return them)
    (We get the users' BM user IDs by calling the spaceMembers query to list the members who are assigned to one of the new spaces.
      As of Thursday February 22, something is weird with this, and about half were missing. This might be because I increased the batch size of the JWT SSO calls to 20, though they're supposed to retry if they fail so maybe that's only the problem if there's a bug with the retry code)
  Call updateMember for each user to set their fields that can't be sent in the JWT SSO call
  Create the posts
  Create the comments of the posts, recursively so that parent comments are created before their replies
  Create post votes/reactions
  Create comment votes/reactions
*/


type CreatedDocument = { documentId?: string; bmPostId?: string; error?: boolean; }

const CREATE_TEST_COLLECTIONS_AND_SPACES = true;
const DELETE_OLD_USERS = false;

const KEENAN_BM_USER_ID = 'GEwYqQhauV';
const KEENAN_WU_USER_ID = 'gAHQznaHCBb3ojWdw';

const bmUserIds = new Map<string, string>(); // a mapping of our user _ids to BM user IDs

const POST_POST_TYPE_ID = 'oR00uvx3sKdsgnb'; // '0bmyNGiG5igigc2'; // 'oR00uvx3sKdsgnb';
const COMMENT_POST_TYPE_ID = 'IzOjciUpA0oGTT0'; // 'eR1hhMVkLBRERat'; // 'IzOjciUpA0oGTT0';

const WHITE_LISTED_EMAILS = [
  'michael.keenan@gmail.com',
  'vlad@sitalo.org',
  'jeremy@wakingup.com',
  'arthur@wakingup.com',
  'gary@wakingup.com',
  'jose@fivekoalas.com',
  'ruud@lassomoderation.com',
  'samr@wakingup.com',
  'community@wakingup.com',
  'arthur@ombaseproductions.com',
  'alberto@fivekoalas.com',
  'fernando+new-user-community@fivekoalas.com',
  'jcharlescarter+262024@gmail.com',
  'fernando@fivekoalas.com',
  'sergio@fivekoalas.com',
  'seth@wakingup.com',
  'ruud+testmember@lassomoderation.com',
]

let tags: DbTag[] = [];

let adminToken: string;

let spaceIndex: number;
let migrationNameSuffix: string;

let startTime: Date;
let endTime: Date;

const TTS_ACTIVATED = false; // turn this off overnight

function logFile() {
  return `betterModeExport-${spaceIndex}.log`;
}

function logJsonToFile(obj: any) {
  logToFile(JSON.stringify(obj, null, 2));
}

function logToFile(...args: any[]): void {
  const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
  console.log(...args);

  fs.appendFile(logFile(), message + '\n', (err) => {
    if (err) {
      console.error('Error writing to log file:', err);
    }
  });
}

const executeCommand = (command: string) => {
  return new Promise((resolve, reject) => {
    exec(command, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error: ${error}`);
        return reject(error);
      }
      logToFile(`stdout: ${stdout}`);
      console.error(`stderr: ${stderr}`);
      resolve(stdout);
    });
  });
};

const say = async (message: string) => {
  logToFile(`Saying: ${message}`);
  if (TTS_ACTIVATED) {
    try {
      const result = await executeCommand(`say ${message}`);
      logToFile(result);
    } catch (error) {
      console.error(error);
    }
  }
}

const collectionSpaces = [
  {
    name: "Discussion",
    id: undefined,
    spaces: [
      {
        name: "Announcements",
        description: "Read notes and announcements from the Waking Up team.",
        id: undefined,
      },
      {
        name: "Introductions",
        description: "Introduce yourself and get started in the community.",
        id: undefined,
      },
      {
        name: "Questions",
        description: "Ask questions about meditation and living an examined life.",
        id: undefined,
      },
      {
        name: "Insights",
        description: "Share insights about meditation, life, and personal experiences.",
        id: undefined,
      },
      {
        name: "Recommendations",
        description: "Share content and resources from the Waking Up app or elsewhere.",
        id: undefined,
      },
      {
        name: "Other",
        description: "Start a discussion that doesn't fit in any other space.",
        id: undefined,
      }
    ]
  },
  {
    name: "Local Groups",
    id: undefined,
    spaces: [
      {
        name: "Connect",
        description: "Connect with Waking Up members and groups near you.",
        id: undefined,
      },
      {
        name: "London",
        description: "A space for Waking Up members in London.",
        id: undefined,
      }
    ]
  },
  {
    name: "Resources",
    id: undefined,
    spaces: []
  }
]

const spaceIds = function() {
  const ids: string[] = [];
  collectionSpaces.forEach(collectionSpace => {
    collectionSpace.spaces.forEach(space => {
      ids.push(space.id!);
    });
  });
  return ids;
}

function formatDuration(startTime: Date, endTime: Date): { startTime: string; endTime: string; duration: string } {
  const duration: number = endTime.getTime() - startTime.getTime();

  const formattedStartTime: string = startTime.toLocaleString();
  const formattedEndTime: string = endTime.toLocaleString();

  const durationHours: number = Math.floor(duration / 3600000);
  const durationMinutes: number = Math.floor((duration % 3600000) / 60000);
  const durationSeconds: number = Math.floor((duration % 60000) / 1000);

  let durationStr = durationHours > 0 ? `${durationHours} hours` : '';
  durationStr += durationMinutes > 0 ? `${durationStr.length > 0 ? ', ' : ''}${durationMinutes} minutes` : '';
  durationStr += durationSeconds > 0 ? `${durationStr.length > 0 ? ', and ' : ''}${durationSeconds} seconds` : '';

  return {
    startTime: formattedStartTime,
    endTime: formattedEndTime,
    duration: durationStr
  };
}

const errors: any[] = []

const options: {
  mk_password?: string,
  keenan_user_only?: boolean
} = {};

const deleteOldBetterModeUsers = async (
  mk_password: string,
  ) => {
  startTime = new Date();
  errors.length = 0;

  /* deleting old test users */

  options['mk_password'] = mk_password;

  const guestToken =        await getGuestToken();
  adminToken =              await getAdminToken(guestToken);

  let iterations = 0;
  const maxIterations = 5;
  while (iterations < maxIterations) {
    const query = {
      "query": `{ members(limit: 1000, status: VERIFIED) { totalCount edges { cursor node { email id createdAt } } } }`
    }

    const resultJson = await callBmApi(query, adminToken);
    logToFile({query})
    logToFile({resultJson})
    logToFile('resultJson.data.members.totalCount', resultJson.data.members.totalCount)
    if (resultJson.data.members.edges.length === 0) return;

    for (const edge of resultJson.data.members.edges) {
      logToFile({edge})
      const bmUserId = edge.node.id as string;
      const email = edge.node.email as string;
      const createdAt = edge.node.createdAt as string;
      logToFile({email})
      logToFile({createdAt})
      if (email.match(/michael\.keenan\+/) || email.match(/spamgourmet/)) {
        logToFile(`Deleting user ${bmUserId} with email ${email}`);
        const deleteQuery = {
          "query": `mutation { deleteMember(id: "${bmUserId}") { status } }`
        }
        const resultJson = await callBmApi(deleteQuery, adminToken);
        logToFile({query})
        logToFile({resultJson})
        logToFile(resultJson?.data?.deleteMember)
      }
    }
    iterations++;
  };
}

function numberFromString(input: string): number|undefined {
  const match = input.match(/\d+/);
  return match ? parseInt(match[0]) : undefined;
}

const deleteOldBetterModeCollectionsAndSpaces = async (
  mk_password: string,
  ) => {
  startTime = new Date();
  errors.length = 0;

  options['mk_password'] = mk_password;

  const guestToken =        await getGuestToken();
  adminToken =              await getAdminToken(guestToken);

  await deleteOldBetterModeSpaces(200, 265);
  await deleteOldBetterModeCollections(200, 265);
}

const deleteOldBetterModeSpaces = async (minIndex: number, maxIndex: number) => {
  const query = {
    "query": "{ spaces(limit: 1000) { nodes { id type slug name createdById } } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  logToFile({query})
  logToFile({resultJson})
  for (const node of resultJson.data.spaces.nodes) {
    logToFile({node})
    const name = node.name as string;
    logToFile({name})
    logToFile('!!!!!!!!!!!')
    logToFile(node.createdById)

    const spaceMigrationNumber = numberFromString(name);

    if (node.createdById !== KEENAN_BM_USER_ID) continue;

    if (spaceMigrationNumber && spaceMigrationNumber > minIndex && spaceMigrationNumber < maxIndex) {
      const spaceId = node.id as string;
      logToFile(`Deleting space ${spaceId} with name ${name}`);
      const deleteQuery = {
        "query": `mutation { deleteSpace(id: "${spaceId}") { status } }`
      }
      const resultJson = await callBmApi(deleteQuery, adminToken);
      logToFile({query})
      logToFile({resultJson})
      logToFile(resultJson?.data?.deleteSpace)
    }
  }
}

const deleteOldBetterModeCollections = async (minIndex: number, maxIndex: number) => {
  const query = {
    "query": "{ collections { id name createdBy { id } } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  logToFile({query})
  logToFile({resultJson})
  for (const collection of resultJson.data.collections) {
    const name = collection.name as string;
    logToFile({name})
    logToFile('!!!!!!!!!!!')
    logToFile(collection.createdBy.id)

    const migrationNumber = numberFromString(name);

    if (collection.createdBy.id !== KEENAN_BM_USER_ID) continue;

    if (migrationNumber && migrationNumber > minIndex && migrationNumber < maxIndex) {
      const collectionId = collection.id as string;
      logToFile(`Deleting collection ${collectionId} with name ${name}`);
      const deleteQuery = {
        "query": `mutation { deleteCollection(id: "${collectionId}") { status } }`
      }
      const resultJson = await callBmApi(deleteQuery, adminToken);
      logToFile({query})
      logToFile({resultJson})
      logToFile(resultJson?.data?.deleteCollection)
    }
  }
}


const betterModeExport = async (
    mk_password: string,
    keenan_user_only?: boolean,
    postIdsToExport?: string[],
    ) => {
  startTime = new Date();
  errors.length = 0;

  logToFile('betterModeExport starting')
  await say("Export starting")

  if (!keenan_user_only && (!postIdsToExport || postIdsToExport.length === 0)) {
    if (DELETE_OLD_USERS) {
      await deleteOldBetterModeUsers(mk_password);
    }
  }

  // const userDataFixKeenanAccount = {
  //   sub: '0b7ebf61-739f-4ac3-a5bf-5f2f835054be',
  //   email: 'michael.keenan@gmail.com',
  //   name: 'Michael Keenan',
  //   iat: Math.round(new Date().getTime() / 1000), // token issue time
  //   exp: Math.round(new Date().getTime() / 1000) + 60
  // }

  // logToFile({userDataFixKeenanAccount})

  // const token = jwt.sign(userDataFixKeenanAccount, JWT_KEY, { algorithm: "HS256" });
  // logToFile("Got user SSO token", token);

  // const url = `https://waking-up-new.bettermode.io/api/auth/sso?jwt=${token}`;

  // logToFile('url', url)

  // const response = await axios.get(url);
  // logToFile('errored in the redirect way: ', !!response.request._redirectable._isRedirect)
  // logToFile('SSO Token sent; response was:', String(response.data).slice(0, 200));
  // if (response.data.startsWith && response.data.startsWith('<!DOCTYPE html')) {
  //   throw "Received error response";
  // }
  
  // logToFile('response.data', response.data);

  // throw 'abort here'



  options['mk_password'] = mk_password;
  options['keenan_user_only'] = keenan_user_only;

  const guestToken =        await getGuestToken();
  logToFile('guestToken', guestToken);
  adminToken =              await getAdminToken(guestToken);
  logToFile('adminToken', adminToken);
  if (CREATE_TEST_COLLECTIONS_AND_SPACES) {
    const spaces =          await listSpaces(adminToken);
    logToFile({spaces});
    spaceIndex =            getNextSpaceNameIndex(spaces);
    logToFile({spaceIndex});
    void say(`Export test ${spaceIndex}`)
    migrationNameSuffix = ` Test ${spaceIndex}`;
    await createCollectionsAndSpaces();
  } else {
    await listFinalCollectionsAndSpaces();
    migrationNameSuffix = '';
  }

  tags = await Tags.find().fetch();

  const users =             options['keenan_user_only'] ?
                              [await keenanUser()] :
                              postIdsToExport ? 
                                await usersFromPosts(postIdsToExport) :
                                await wakingUpUsers();

  logToFile('users', users.slice(0,3))

  await createUsers(users);

  await setBmUserIds(users);
  
  logToFile({bmUserIds});

  await updateUsersFields(users);


  const bmPosts =           await createPosts(postIdsToExport);

  logToFile({bmPosts});
  const postIds =           bmPosts.map(createdPost => createdPost.documentId!);

  const comments =          await Comments.find({postId: {$in: bmPosts.map(createdPost => createdPost.documentId) }}).fetch();
  logToFile({comments});

  const bmComments =        await createComments(comments, bmPosts);
  logToFile({bmComments});

  const postReactions =     await addReactions("Posts", postIds, bmPosts);
  logToFile({postReactions});
  const commentReactions =  await addReactions("Comments", comments.map(c => c._id), bmComments);
  logToFile({commentReactions});
  await hideNonFrontpagePosts(postIds, bmPosts);

  endTime = new Date();
  logToFile('####################')
  logToFile(errors)
  logToFile(`${errors.length} errors`)
  logToFile(`Migration${migrationNameSuffix} complete`);
  logToFile('')

  const timeDetails = formatDuration(startTime, endTime);
  logToFile(`Start Time: ${timeDetails.startTime}`);
  logToFile(`End Time: ${timeDetails.endTime}`);
  logToFile(`Duration: ${timeDetails.duration}`);

  await say(`Export ${migrationNameSuffix} complete in ${timeDetails.duration}`)
}

const hideNonFrontpagePosts = async (postIds: string[], bmPosts: CreatedDocument[]) => {
  logToFile("Hiding non-frontpage posts")
  const postsToHide = await Posts.find({_id: {$in: postIds}, frontpageDate: null}).fetch();
  logToFile({postsToHide});
  
  for (const post of postsToHide) {
    const bmPost = bmPosts.find(bmPost => bmPost.documentId === post._id);
    if (bmPost) {
      const query = {
        "query": `mutation { hidePost(id: "${bmPost.bmPostId}") { status } }`
      }
      const resultJson = await callBmApi(query, adminToken);
      logToFile({resultJson})
      logToFile(resultJson?.data?.hidePost)
    } else {
      errors.push(`no bmPost for non-frontpage post ${post._id}`);
      logToFile(`no bmPost for non-frontpage post ${post._id}`);
    }
  }
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
  logToFile('getAdminToken resultJson', resultJson);
  return resultJson.data.loginNetwork.accessToken;
}

const listSpaces = async (adminToken: string) => {
  const query = {
    "query": "{ spaces(limit: 1000) { nodes { id type slug name } } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  return resultJson.data.spaces.nodes.map((node: any) => node.name);
}

const getNextSpaceNameIndex = (spaces: string[]) => {
  const regex = new RegExp(`Test (\\d+)`);

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

  return maxNumber + 1;
}

const createCollectionsAndSpaces = async () => {
  await createCollections();
  await createSpaces();
}

const createCollections = async () => {
  for (const collectionSpace of collectionSpaces) {
    const collectionName = collectionSpace.name + migrationNameSuffix;
    
    const query = {
      "query": `mutation { createCollection(input: { name: "${collectionName}" }) { name id slug } }`
    }
    try {
      const resultJson = await callBmApi(query, adminToken);
      collectionSpace.id = resultJson.data.createCollection.id;
    } catch (error) {
      errors.push(error);
      logToFile('createSpace error', error);
      throw error;
    }
  }
}

const createSpaces = async () => {
  for (const collectionSpace of collectionSpaces) {
    for (const space of collectionSpace.spaces) {
      space.id = await createSpace(space.name + migrationNameSuffix, space.description + migrationNameSuffix);
      await updateSpacePostTypes(space.id!);
    }
  }
}

const listFinalCollectionsAndSpaces = async () => {
  await listFinalCollections();
  await listFinalSpaces();
}

const listFinalCollections = async () => {
  const query = {
    "query": "{ collections { id name } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  logToFile({query})
  logToFile({resultJson})
  for (const collection of resultJson.data.collections) {
    for (const collectionSpace of collectionSpaces) {
      if (collection.name === collectionSpace.name) {
        collectionSpace.id = collection.id;
      }
    }
  }
}

const listFinalSpaces = async () => {
  const query = {
    "query": "{ spaces(limit: 1000) { nodes { id name } } }"
  };

  const resultJson = await callBmApi(query, adminToken);
  logToFile({query})
  logToFile({resultJson})
  for (const node of resultJson.data.spaces.nodes) {
    for (const collectionSpace of collectionSpaces) {
      for (const space of collectionSpace.spaces) {
        if (node.name === space.name) {
          space.id = node.id;
        }
      }
    }
  }
}

// const deleteOldSpaces = async (spaces: any, spaceIndex: number) => {
//   for (const space of spaces) {
//     const query = `mutation { deleteSpace(id: "${spaceId}") { status } }`;

//     const resultJson = await callBmApi(query, adminToken);
//   }
  
//   logToFile({query})
//   logToFile({resultJson})
//   for (const edge of resultJson.data.members.edges) {
//     logToFile({edge})
//     const bmUserId = edge.node.id as string;
//     const email = edge.node.email as string;
//     logToFile({email})
//     logToFile(!!email.match(/keenan/))
//     if (email.match(/keenan/) && email !== 'michael.keenan@gmail.com') {
//       logToFile(`Deleting user ${bmUserId} with email ${email}`);
//       const deleteQuery = {
//         "query": `mutation { deleteMember(id: "${bmUserId}") { status } }`
//       }
//       const resultJson = await callBmApi(deleteQuery, adminToken);
//       logToFile({query})
//       logToFile({resultJson})
//       logToFile(resultJson?.data?.deleteMember)
//     }
//   }
// }

const collectionIdFromSpaceName = (name: string) => {
  for (const collection of collectionSpaces) {
    for (const space of collection.spaces) {
      if (space.name + migrationNameSuffix === name) {
        return collection.id!;
      }
    }
  }
  throw `No collection found for space name ${name}`;
}

const createSpace = async (name: string, description: string) => {
  const collectionId = collectionIdFromSpaceName(name);

  const query = {
    "query": `mutation { createSpace(input: { name: "${name}", description: "${description}", collectionId: "${collectionId}", whoCanPost: [member admin] }) { name id url } }`
  }
  try {
    const resultJson = await callBmApi(query, adminToken);
    return resultJson.data.createSpace.id;
  } catch (error) {
    errors.push(error);
    logToFile('createSpace error', error);
    throw error;
  }
}

const updateSpacePostTypes = async (spaceId: string) => {
  const query = {
    "query": `mutation { updateSpacePostTypes(input: [{ postTypeId: "${POST_POST_TYPE_ID}" }], spaceId: "${spaceId}" ) { postTypeId } }`
  };

  const maxAttempts = 30;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const resultJson = await callBmApi(query, adminToken);
      if (resultJson.errors) {
        // Sometimes this has an error, despite it being the same input each time
        // (except the spaceId, though the space is created the same way each
        // time). It is most perplexing.
        logToFile('!!!!!!');
        logToFile(resultJson.errors);
        errors.push(resultJson.errors);
        logToFile("updateSpacePostTypes failed, trying again.")
        attempts++;
      } else {
        return true;
      }
    } catch (error) {
      attempts++;
      errors.push(error);
      logToFile('updateSpacePostTypes error', error);
      logToFile("Trying again in two seconds.")
      await new Promise(resolve => setTimeout(resolve, 2000));
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

  const users = await Users.find({_id: {$in: uniqueUserIds}, deleted: {$ne: true}, deleteContent: {$ne: true}, banned: {$exists: false}, username: {$exists: true}}).fetch();
  return users;
}

const wakingUpUsers = async () => {
  return await Users.find({deleted: {$ne: true}, deleteContent: {$ne: true}, banned: {$exists: false}, username: {$exists: true}}).fetch();
}

const keenanUser = async () => {
  // return (await Users.findOne({email: 'jeremy@wakingup.com'})) as DbUser;
  return (await Users.findOne({_id: KEENAN_WU_USER_ID})) as DbUser;
}

// const createUsers = async (users: DbUser[]) => {
//   logToFile(`Creating ${users.length} users`)
//   for (const user of users) {
//     if (user.deleteContent || user.deleted || !user.username) continue;
//     await createUser(user);
//   }
// }


// This more-complex version of createUsers (provided by ChatGPT) runs up to 8
// createUser calls concurrently. It waits for each batch of 8 to complete
// before starting the next batch.
const createUsers = async (users: DbUser[]) => {
  logToFile(`Creating ${users.length} users`);

  const createUserPromises = [];
  let concurrency = 0;
  const maxConcurrency = 8;

  for (const user of users) {
    if (!user.username) continue;

    // Limit concurrency
    if (concurrency >= maxConcurrency) {
      await Promise.all(createUserPromises);
      createUserPromises.length = 0;
      concurrency = 0;
    }

    const createUserPromise = createUser(user)
      .then(() => {
        // After the createUser call is complete, decrement concurrency
        concurrency--;
      })
      .catch((error) => {
        // Handle errors here if needed
        console.error('Error creating user:', error);
      });

    createUserPromises.push(createUserPromise);
    concurrency++;
  }

  // Ensure that any remaining createUser calls are completed
  await Promise.all(createUserPromises);
};


function createUserSSOToken(user: DbUser, privateKey: string) {
  const email = mangleEmailAsKeenanEmail(user.email, 0);

  const name = user.first_name?.length && user.last_name?.length ?
    user.first_name.trim() + ' ' + user.last_name.trim():
    user.username?.trim();
  
  logToFile(`Creating SSO token for ${name} (${email})`)

  const $ = cheerio.load(user.biography?.html || '');
  const bio = $.root().text()

  const joinedWakingUp = user.wu_created_at?.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });

  const userData = {
    sub: user.wu_uuid,
    email,
    name,
    bio,
    city: user.mapLocation?.vicinity,
    joinedWakingUp,
    picture: getProfileImageUrl(user),
    iat: Math.round(new Date().getTime() / 1000), // token issue time
    exp: Math.round(new Date().getTime() / 1000) + 60, // token expiration time
    spaceIds: spaceIds(),
  };

  logToFile({userData})

  return jwt.sign(userData, privateKey, { algorithm: "HS256" });
}

function getProfileImageUrl(user: DbUser) {
  if (!user.profileImageId) return user.avatar
  
  let cloudinaryProps: CloudinaryPropsType = {
    c: "fill",
    dpr: "auto",
    q: "auto",
    f: "auto",
    g: "auto:faces"
  };

  return makeCloudinaryImageUrl(user.profileImageId, cloudinaryProps)
}

async function sendSSOToken(token: string): Promise<void> {
  const url = `https://waking-up-new.bettermode.io/api/auth/sso?jwt=${token}`;

  try {
    const response = await axios.get(url);
    logToFile('SSO Token sent; response was:', String(response.data).slice(0, 100));
    if (response.request._redirectable._isRedirect) {
      await say("Dreaded redirect error occurred")
      throw "Received redirect-to-HTML response";
    } else {
      return response.data;
    }
  } catch (error) {
    console.error('Error:', error);
    throw error;
  }
}

async function setBmUserIds(users: DbUser[]) {
  logToFile(`Setting bmUserIds for ${users.length} users`)

  const maxPages = 10;
  let pages = 0;

  while (pages < maxPages) {
    const query = {
      "query": `{ spaceMembers(limit: 1000, spaceId: "${spaceIds()[0]}", offset: ${pages * 1000}) { totalCount edges { cursor node { member { id email name username } } } } }`
    }

    const resultJson = await callBmApi(query, adminToken);
    logToFile({query})
    logToFile({resultJson})
    logToFile('resultJson.data.spaceMembers.totalCount', resultJson.data.spaceMembers.totalCount)
    if (resultJson.data.spaceMembers.totalCount === '0') return;

    for (const edge of resultJson.data.spaceMembers.edges) {
      logJsonToFile(edge?.node?.member);
      const bmUserId = edge.node.member.id as string;
      if (options['keenan_user_only']) {
        const kUser = await keenanUser();
        bmUserIds.set(kUser._id, bmUserId);
      } else {
        const email = edge.node.member.email;
        const user = users.find(user => mangleEmailAsKeenanEmail(user.email, 0) === email);
        if (!user) {
          if (email !== 'michael.keenan@gmail.com') {
            logToFile(`Found space member with ${email} but there's no WU forum user with that email. (Probably fine if CREATE_TEST_COLLECTIONS_AND_SPACES is false. CREATE_TEST_COLLECTIONS_AND_SPACES: ${CREATE_TEST_COLLECTIONS_AND_SPACES})`);
            logToFile(edge.node.member);
          }
          continue;
        }

        bmUserIds.set(user._id, bmUserId);
      }
    };

    pages++;
  }
}

// Users can be created with JWT SSO logins, which allow only a few fields to be sent. We update the remaining ones here.
async function updateUsersFields(users: DbUser[]) {
  logToFile(`updating users in bmUserIds`, JSON.stringify(Array.from(bmUserIds.entries())));
  for (const user of users) {
    if (!user.username) continue;

    await updateUserFields(user);
  }
}

const getBmUserIdByEmail = async (user: DbUser) => {
  const email = mangleEmailAsKeenanEmail(user.email, 0);
  const query = {
    "query": `{ members(limit: 1, filterBy: { key: "email", operator: equals, value: "\\"${email}\\""}) { totalCount edges { cursor node { id email name } } } }`
  };

  const resultJson = await callBmApi(query, adminToken);
  return resultJson.data.members.edges[0].node.id;
}

// Sometimes we don't user have the bmUserId, which I currently think is because
// the JWT SSO method doesn't work 100% of the time. So, we'll give it another
// shot (or rather, ten shots).
async function createUserIfMissing(user: DbUser) {
  if (bmUserIds.has(user._id)) return;

  logToFile(`Creating user ${user.username} ${user._id} because they're missing from bmUserIds`)
  const maxAttempts = 10;
  let attempts = 0;
  while (attempts < maxAttempts) {
    await createUser(user)
    const bmUserId = await getBmUserIdByEmail(user);
    if (bmUserId) {
      bmUserIds.set(user._id, bmUserId);
      return;
    } else {
      attempts++;
      logToFile("Waiting two seconds");
      await new Promise(resolve => setTimeout(resolve, 2000));
      logToFile("Continuing...");
    }
  }
}

async function updateUserFields(user: DbUser) {
  await createUserIfMissing(user);

  const trimmedUsername = user.username?.trim() || '';
  const fullName = user.first_name?.trim() + ' ' + user.last_name?.trim();
  // usernames must be between 3 and 50 characters long
  // (though there's a problem guy with emojis in his username, and different computers sometimes count emoji lengths differently, so watch out for further problems)
  // "Stef Raharjo-Gunawan Zhou-Lin 🇦🇺🇮🇩🇨🇳 / Sage Shawaman 🏳️‍🌈\"
  const username = trimmedUsername.length > 3 ?
                      user.username?.trim().slice(0, 50) :
                      fullName.length > 3 ? 
                      fullName :
                        '[no username]';

  const maxAttempts = 5;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const usernameSuffix = attempts === 0 ? '' : `-${spaceIndex}-${attempts}`;
      const query = {
        "query": `mutation { updateMember(id: "${bmUserIds.get(user._id)}", input: { username: "${username + usernameSuffix}", settings: { privateMessaging: { privateMessagingEnabled: ${!user.disableUnsolicitedMessages} } } } ) { id } }`
      }
      
      const resultJson = await callBmApi(query, adminToken);
      logToFile({query})
      logToFile({resultJson})
      
      if (resultJson.errors?.[0]?.message === "Username already taken.") {
        logToFile(`Username ${username + usernameSuffix} already taken. Trying another.`);
        attempts++;
        continue;
      } else {
        return;
      }
    } catch (error) {
      attempts++;
      logToFile({error})
      logToFile('Waiting two seconds');
      await new Promise(resolve => setTimeout(resolve, 2000));
      logToFile('Continuing...');
    }
  }
  
}

const createUser = async (user: DbUser) => {
  /* The following commented-out code is the old way of creating users, using
  the GraphQL API. It's been replaced by the JWT SSO method, which creates users
  as already verified and doesn't send them verification emails. */

  // const bmUserId = await createUserWithJoinNetworkApiCall(user);

  // const query = {
  //   "query": `mutation { updateMember(id: "${bmUserId}", input: { username: "${spaceId}${randomString(3)}${user.username}", externalId: "${user.wu_uuid + '-' + spaceId.slice(0, 5)}", settings: { privateMessaging: { privateMessagingEnabled: ${!user.disableUnsolicitedMessages} } } } ) { id } }`
  // }
  
  // const resultJson = await callBmApi(query, adminToken);
  // logToFile({query})
  // logToFile({resultJson})

  // if (resultJson.errors) {
  //   logToFile(resultJson.errors)
  //   logToFile(JSON.stringify(resultJson.errors, null, 2));
  //   throw 'updateMember failed';
  // }

  logToFile("Getting user SSO token");

  const maxAttempts = 5;
  let attempts = 0;
  while (attempts < maxAttempts) {
    try {
      const token = createUserSSOToken(user, JWT_KEY);
      logToFile("Got user SSO token", token);

      await new Promise(resolve => setTimeout(resolve, 2000));

      const retVal = await sendSSOToken(token);
      logToFile({retVal});

      return retVal;
    } catch (error) {
      attempts++;
      logToFile({error})
      logToFile('Waiting two seconds');
      await new Promise(resolve => setTimeout(resolve, 2000));
      logToFile(`Continuing to attempt ${attempts+1}...`);
    }
  }
  throw "sendSSOToken failed too many times";
}

const createUserWithJoinNetworkApiCall = async (user: DbUser) => {
  const name = user.first_name?.length && user.last_name?.length ?
    user.first_name + ' ' + user.last_name :
    null
  
  const password = passwordForTest(user);

  let suffix = 0;

  while (suffix < 100) {
    const email = mangleEmailForTest(user.email, suffix);
    const usernameParam = user.username && user.username.length >= 3 ? `username: "${user.username}WUTM${spaceIndex}-${suffix}",` : '';
    const query = {
      "query": `mutation { joinNetwork(input: { name: "${name}", ${usernameParam} email: "${email}", password: "${password}" }) { accessToken member { id locale networkId roleId teammate username email } } }`
    }

    const resultJson = await callBmApi(query, adminToken);
    logToFile('ran joinNetwork', {query}, {resultJson})
    if (resultJson.errors) {
      if (resultJson.errors.some((e: any) => e.errors.some((e2: any) => e2.message = "This username's already taken"))) {
        logToFile(`createUser ${user.username}WUTM${spaceIndex}-${suffix} already taken`);
      }
      if (resultJson.errors.some((e: any) => e.errors.some((e2: any) => e2.message = "This email's already taken"))) {
        logToFile(`createUser ${email} already taken`);
      }
      suffix++;
    } else {
      if (resultJson.data?.joinNetwork) {
        logToFile('got user', resultJson.data.joinNetwork.member.id);
        logToFile(JSON.stringify(resultJson.data.joinNetwork.member, null, 2));
        logToFile(JSON.stringify(resultJson.data.joinNetwork, null, 2));
        bmUserIds.set(user._id, resultJson.data.joinNetwork.member.id);
        return resultJson.data.joinNetwork.member.id;
      } else {
        logToFile('createUser resultJson', resultJson);
        logToFile({query});
        throw "no joinNetwork resultJson";
      }
    }
  }
  logToFile(`createUser couldn't find a unique username for ${user.username}, id ${user._id} after 100 tries`);
  throw `createUser couldn't find a unique username for ${user.username}, id ${user._id} after 100 tries`;
}

function extractDomainPrefix(domain: string) {
  const dotIndex = domain.indexOf('.');
  if (dotIndex >= 0 && dotIndex < 3) {
    return domain.substring(0, dotIndex);
  }
  return domain.substring(0, 3);
}

// mangleEmailForTest usually sends all the signup emails to my spamgourmet
// account, using the ".0." suffix, which instructs it to accept zero of them,
// i.e. discard them all.
// If we're importing thousands of users, we'll send them
// all there. If we're in "keenan_user_only" mode, we'll send it to Keenan's
// gmail.
const mangleEmailForTest = (email: string|null, suffix: number) => {
  if (!email) return `michael.keenan+noemail.${spaceIndex}-${suffix}@gmail.com`;
  // if (!email) return `noemail${spaceIndex}-${suffix}.0.michaelkeenan@spamgourmet.com`;

  const [name, domain] = email.split('@');
  const domainPrefix = extractDomainPrefix(domain);
  const abbreviatedEmailPart = `${name}.${domainPrefix}.${spaceIndex}-${suffix}`;
  // return `michael.keenan+${name}.${domainPrefix}.${spaceIndex}-${suffix}@gmail.com`;
  return options['keenan_user_only'] ?
    `michael.keenan+${abbreviatedEmailPart}@gmail.com` :
    `${abbreviatedEmailPart}.0.michaelkeenan@spamgourmet.com`;
}

const mangleEmailAsKeenanEmail = (email: string|null, suffix: number) => {
  if (!email) return `michael.keenan+noemail.${spaceIndex}-${suffix}@gmail.com`;

  if (WHITE_LISTED_EMAILS.includes(email)) return email;
  
  const [name, domain] = email.split('@');
  const domainPrefix = extractDomainPrefix(domain);
  const abbreviatedEmailPart = `${name}.${domainPrefix}.${spaceIndex}-${suffix}`;
  return `michael.keenan+${abbreviatedEmailPart}@gmail.com`;
}

const passwordForTest = (user: DbUser) => {
  return 'b3foreYouG0G0!';
}

const createPosts = async (postIds?: string[]) => {
  logToFile({postIds})
  const posts = postIds
    ? await Posts.find({_id: {$in: postIds}}).fetch()
    : await Posts.find({ deletedDraft: false, status: 2}).fetch();
    // : await Posts.find({baseScore: {$gte: 21}, deletedDraft: false, status: 2}).fetch();

  let createdPosts: CreatedDocument[] = [];
  // using for...of instead of forEach because forEach won't wait for the
  // setTimeout, so it'll get rate limited

  for (const post of posts) {// for (const post of posts.slice(0, 1)) {
    createdPosts.push(await createPost(post));
  }

  return createdPosts;
}


const spaceIdByName = (name: string) => {
  for (const collectionSpace of collectionSpaces) {
    const space = collectionSpace.spaces.find(space => space.name === name);
    if (space) return space.id!;
  }

  throw `no space with name ${name}`;
}

const spaceIdFromPost = async (post: DbPost) => {
  // It's inefficient to do one db call at a time like this; maybe fix that by querying all TagRels at once
  const tagRel = await TagRels.findOne({postId: post._id, deleted: false});

  if (!tagRel) return spaceIdByName("Other");

  const tag = tags.find(tag => tag._id === tagRel.tagId)!;

  if (tag.name === 'Announcements') return spaceIdByName("Announcements");
  if (tag.name === 'Recommendations') return spaceIdByName("Recommendations");
  if (tag.name === 'Quotes') return spaceIdByName("Other");
  if (tag.name === 'Casual') return spaceIdByName("Other");
  if (tag.name === 'Local') return spaceIdByName("Connect");

  if (post.title.indexOf('?') >= 0) return spaceIdByName("Questions");

  return spaceIdByName("Insights");
}

const createPost = async (post: DbPost) => {
  const title = post.title;
  const content = removeInternalLinks(post.contents.html)
    .replace(/"/g, '\\\\\\"');
  const publishedAt = post.postedAt;

  logToFile({bmUserIds})
  const bmUserId = options['keenan_user_only'] ?
                    bmUserIds.values().next().value :
                    bmUserIds.get(post.userId);
  logToFile({bmUserId})

  const spaceId = await spaceIdFromPost(post);

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
    logToFile('createPost resultJson', resultJson);
    return {
      documentId: post._id,
      bmPostId: resultJson.data.createPost.id as string
    }
  } catch (e) {
    logToFile("error occurred with this query", query);
    return {
      error: true,
    };
  }
}

const createComments = async (comments: DbComment[], bmPosts: CreatedDocument[]) => {
  let bmComments: CreatedDocument[] = [];

  // Iterate through top-level ones (the ones with no parentCommentId);
  // after each one, recursively handle its replies (the ones with that
  // comment's id as their parentCommentId) and their replies, etc.

  for (const comment of comments) {
    if (comment.parentCommentId) continue;

    await createCommentRecursive(comment, comments, bmPosts, bmComments);
  }

  return bmComments;
}

const parentCommentQuote = (commentId: string, comments: DbComment[]) => {
  const comment = comments.find(c => c._id === commentId);
  if (!comment) throw `no comment with id ${commentId}`;
  return truncatise(comment.contents.html.replace(/\\/g, '\\\\\\\\').replace(/"/g, '\\\\\\"'), { TruncateBy: 'characters', TruncateLength: 50 })
            .replace(/<\/p><p>.*/, '') // if there's a paragraph break inside the truncation threshold, just take the first paragraph
            .replace(/\\*\.\.\.<\/p>$/, '...</p>') // remove trailing backslashes (so we don't cut off in the middle of an escape sequence)
            .replace(/^<p>(.*)<\/p>$/g, '<blockquote>$1</blockquote>');
}

const createCommentRecursive = async (comment: DbComment, comments: DbComment[], bmPosts: CreatedDocument[], bmComments: CreatedDocument[]) => {
  if (comment!.contents.html.length === 0) {
    // This comment has no contents, which is strange but happens at least once. If it has no children, we'll skip it. If it has children, we'll give it the contents "[empty comment]" and continue.
    const commentChildren = comments.filter(c => c.parentCommentId === comment._id);
    if (commentChildren.length === 0) {
      logToFile('createCommentRecursive skipping comment with no contents and no children', comment._id);
      return;
    }
  }

  const $ = cheerio.load(comment.contents.html);
  $('style').remove(); // Remove all <style> tags
  const cleanedContents = $.html()?.slice(25, -14) || ''; // slice off the <html><head></head><body> and </body></html> tags
  // logToFile({cleanedContents});

  const contents = cleanedContents === '' ? '[empty comment]' : removeInternalLinks(cleanedContents)
                                                                               .replace(/\\/g, '\\\\\\\\')
                                                                               .replace(/"/g, '\\\\\\"');

  const publishedAt = comment.postedAt;

  // This commented-out code exports the same structure as in this ForumMagnum codebase, where comments can be nested arbitrarily deeply. We're not going to do that for this BetterMode migration, and will only support one level of nesting (unless plans change).
  // const bmPostId = comment.parentCommentId ?
  //   bmComments.find(bmComment => bmComment.documentId === comment.parentCommentId)?.bmPostId :
  //   bmPosts.find(bmPost => bmPost.documentId === comment.postId)?.bmPostId;

  const bmPostId = comment.topLevelCommentId ?
    bmComments.find(bmComment => bmComment.documentId === comment.topLevelCommentId)?.bmPostId :
    bmPosts.find(bmPost => bmPost.documentId === comment.postId)?.bmPostId;

  logToFile({bmPostId})

  if (!bmPostId) {
    logToFile({comment})
    logToFile({bmComments})
    throw `no bmPostId for ${comment._id}`;
  }

  const quotedContent = !comment.parentCommentId || comment.parentCommentId === comment.topLevelCommentId ?
    contents :
    parentCommentQuote(comment.parentCommentId, comments) + ' ' + contents;

  const quotedEscapedContent = quotedContent.replace(/"/g, '\\\\\\"');

  const bmUserId = options['keenan_user_only'] ?
                    bmUserIds.values().next().value :
                    bmUserIds.get(comment.userId);
logToFile(`creating reply from user ${bmUserId}`)
  const query = {
    "query": `mutation {
      createReply(
        input: {
          postTypeId: "${COMMENT_POST_TYPE_ID}",
          mappingFields: [
            { type: text, key: "content", value: "\\"${quotedContent}\\"" }
          ],
          tagNames: [],
          attachmentIds: [],
          publish: true,
          ownerId: "${bmUserId}",
          createdAt: "${publishedAt}",
          publishedAt: "${publishedAt}"
        },
        postId: "${bmPostId}")
          { id }
    }`
  };

  const resultJson = await callBmApi(query, adminToken);

  try {
    logToFile('createComment resultJson', resultJson);
    if (resultJson.errors) {
      logToFile('!!!!!!!!!!')
      logToFile('createComment errors', resultJson.errors);
      logToFile(JSON.stringify(resultJson));
      logToFile(resultJson.errors[0].message);
      logToFile(resultJson.errors[0].errors);
      logToFile(JSON.stringify(resultJson.errors[0].errors, null, 2));
      logToFile('createComment query', query);
      logToFile('comment id', comment._id);
      logToFile('comment contents.html', comment.contents.html);
    }
    if (!resultJson.data?.createReply) {
      logToFile('@@@@@@@@@@@');
      logToFile({resultJson});
      logToFile(JSON.stringify(resultJson, null, 2));
    }
    const bmCommentId = resultJson.data.createReply.id as string;

    if (!bmCommentId) {
      logToFile({comment})
      throw `no bmCommentId for ${comment._id}`;
    }

    bmComments.push({
      documentId: comment._id,
      bmPostId: bmCommentId
    });

    const commentChildren = comments.filter(c => c.parentCommentId === comment._id);
    for (const commentChild of commentChildren) {
      await createCommentRecursive(commentChild, comments, bmPosts, bmComments);
    }
  } catch (e) {
    errors.push(e);
    logToFile({e})
    logToFile("error occurred with this query", query);
    logToFile({resultJson})
  }
}

const addReactions = async (type: string, ids: string[], bmPosts: CreatedDocument[]) => {
  logToFile('addReactions', {type}, {ids}, {bmPosts})
  if (options['keenan_user_only']) {
    logToFile("keenan_user_only mode; skipping reactions")
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
      logToFile(`no document for vote ${vote._id}, type ${type}, ids: ${ids}`);
      throw `no document for vote ${vote._id}`;
    }
    const bmPost = bmPosts.find(bmPost => bmPost.documentId === document._id);

    if (!bmPost) {
      errors.push(`no bmPost for vote ${vote._id}, type ${type}, ids: ${ids}`);
      logToFile(`no bmPost for vote ${vote._id}, type ${type}, ids: ${ids}`);
      continue;
    }

    await addReaction(bmPost.bmPostId!, document, vote, 'like');
  }
}

const addReaction = async (bmPostId: string, document: DbPost|DbComment, vote: DbVote, reactionType: string) => {
  const voterId = bmUserIds.get(vote.userId);

  const query = {
    "query": `mutation {
      addReaction(
        input: {
          participantId: "${voterId}",
          reaction: "${reactionType}",
        },
        postId: "${bmPostId}")
      { status }
    }`
  };

  const resultJson = await callBmApi(query, adminToken);
  logToFile(JSON.stringify(resultJson, null, 2));

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

function apiCallNameFromQuery(query: any) {
  const mutationRegex = /mutation\s*\{\s*([a-zA-Z]+)\(/s;
  const match = query.query.match(mutationRegex);
  const mutationName = match ? match[1] : null;
  if (mutationName) return mutationName;

  const queryRegex = /\{([^(]*)(?:\(| \{)/s;
  const queryMatch = query.query.match(queryRegex);
  const queryName = queryMatch ? queryMatch[1].trim() : null;
  
  if (queryName) return queryName;

  logToFile("couldn't find mutation or query name for", query);
  throw "couldn't find mutation or query name";
}

function logBmApiError(errors: any, query: any) {
  // don't record "Username already taken" errors; they're caught and retried with different usernames
  if (errors?.[0]?.message === "Username already taken.") return;

  const loggableErrors = JSON.stringify(errors, null, 2)
  errors.push([loggableErrors, query]);
  logToFile('callBmApi errors', loggableErrors);
  logToFile('query', query);
}

async function callBmApi(query: any, token?: string|undefined) {
  logToFile('waiting a tenth of a second'); // BetterMode rate limits to 10 requests per second
  await new Promise(resolve => setTimeout(resolve, 100));

  logToFile(`Running ${apiCallNameFromQuery(query)}`);

  const raw = JSON.stringify(query);

  // Re-attempts are only for 502: Bad gateway errors and socket errors. Other errors are not retried.  
  // (Though maybe we should retry everything? Maybe especially 500 internal server errors?)
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
        logToFile('####################')
        logToFile('callBmApi JSON parse error', e);
        logToFile('result', result);
        if (result.startsWith('<!DOCTYPE html>') && result.includes('502: Bad gateway')) {
          attempts++;
          logToFile('502: Bad gateway');
          logToFile('We can just try again');
          logToFile('Waiting five seconds for their server to recover');
          await new Promise(resolve => setTimeout(resolve, 5000));
          logToFile('Continuing...');
          continue;
        }
        throw e;
      }
      if (resultJson.errors?.length > 0) {
        logBmApiError(resultJson.errors, query);
      }

      return resultJson;
    } catch (error) {
      logToFile('callBmApi error', error);
      if (error.message === 'fetch failed') {
        logToFile('Retrying due to fetch failed');
        attempts++;
        continue;
      }
      if (apiCallNameFromQuery(query) === 'updateSpacePostTypes') {
        logToFile('updateSpacePostTypes error');
        logToFile({query});
        throw error;
      }
      errors.push(error);
      return {};
    }
  }
}

const removeInternalLinks = (html: string) =>
  html.replace(/<a href="[^"]*community.wakingup.com[^"]*">(.*?)(?:<\/a>)/g,
    (match, linkText) => {
      if (linkText.includes('community.wakingup.com')) {
        return '(inactive link)'
      }
      return linkText
    })

Vulcan.wuBetterModeExport = betterModeExport
Vulcan.wuDeleteOldBetterModeUsers = deleteOldBetterModeUsers
Vulcan.wuDeleteOldBetterModeCollectionsAndSpaces = deleteOldBetterModeCollectionsAndSpaces
