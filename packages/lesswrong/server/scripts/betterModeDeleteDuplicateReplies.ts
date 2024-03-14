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

/*
  Get guest token
  Get member token
  Iterate through three users:
      OuyzkNkUZW (Jeremy)
      QX4XjGnNHC (WU Team)
      2hqwUa6EDm (Sam Rosen)
    List replies (with memberPosts hasParent: true)
    Iterate through them all, getting their posts, and deleting them if updatedAt < 2024-03-12T19:27:24.177Z AND if that matches two replies out of three
*/

const KEENAN_BM_USER_ID = 'GEwYqQhauV';
const KEENAN_WU_USER_ID = 'gAHQznaHCBb3ojWdw';

const NETWORK_ID = 'W8Cwe1qPqK';

let adminToken: string;

let startTime: Date;
let endTime: Date;

const TTS_ACTIVATED: 'ALWAYS'|'NEVER'|'DAYTIME' = 'DAYTIME';

function logFile() {
  return `betterModeDuplicateRepliesDeletion.log`;
}

function logJsonToFile(obj: any) {
  logToFile(JSON.stringify(obj, null, 2));
}

function logToFile(...args: any[]): void {
  try {
    const message = args.map(arg => typeof arg === 'object' ? JSON.stringify(arg, null, 2) : arg).join(' ');
    console.log(...args);

    // This used to be the async version, which was faster, but it was so annoying to have the logs out of order
    fs.appendFileSync(logFile(), message + '\n');
  } catch (error) {
    console.error('Error writing to log file:', error);
    console.log({args});
  }
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

const shouldSpeakAloud = function() {
  // @ts-ignore
  if (TTS_ACTIVATED === 'ALWAYS') {
    return true;
    // @ts-ignore
  } else if (TTS_ACTIVATED === 'NEVER') {
    return false;
  } else {
    const now = new Date();
    const hours = now.getHours();

    if (hours >= 23 || hours < 9) {
      return false;
    } else {
      return true;
    }
  }
}

const say = async (message: string) => {
  logToFile(`Saying: ${message}`);
  if (shouldSpeakAloud()) {
    try {
      const result = await executeCommand(`say ${message}`);
      logToFile(result);
    } catch (error) {
      console.error(error);
    }
  }
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

const cutoffDate = new Date("2024-03-12T15:00:00.000Z");

const errors: any[] = []

const options: {
  mk_password?: string,
} = {};

/* ########################################################## */
/* ############## The Actual Script Starts Here ############# */
/* ########################################################## */

const userIds = ['OuyzkNkUZW', 'QX4XjGnNHC', '2hqwUa6EDm'];

const betterModeDuplicateRepliesDeletion = async (
    mk_password: string,
    ) => {
  startTime = new Date();
  errors.length = 0;

  options['mk_password'] = mk_password;

  logToFile('betterMode duplicate replies deletion script starting')
  await say("Duplicate replies deletion starting")

  const guestToken =        await getGuestToken();
  logToFile('guestToken', guestToken);
  adminToken =              await getAdminToken(guestToken);
  logToFile('adminToken', adminToken);

  // const users = await Users.find({_id: {$in: userIds}}).fetch();

  // say("Got users");

/*
    List replies (with memberPosts hasParent: true)
    Iterate through them all, getting their posts, and deleting them if updatedAt < 2024-03-12T19:27:24.177Z AND if that matches two replies out of three
*/

  for (const userId of userIds) {
    // const bmUser = await getBmUserByEmail(user);

    const query = {
      "query": `{ memberPosts(limit: 1000, memberId: "${userId}", hasParent: true) { totalCount nodes { id title shortContent updatedAt } } }`
    }
    const resultJson = await callBmApi(query, adminToken);

    logJsonToFile({resultJson});

    // Group the posts by their title, then delete all but the most recent one by updatedAt
    const postsByTitle: {[title: string]: any[]} = {};
    for (const post of resultJson.data.memberPosts.nodes) {
      if (!postsByTitle[post.title]) postsByTitle[post.title] = [];
      postsByTitle[post.title].push(post);
    }

    for (const title in postsByTitle) {
      const posts = postsByTitle[title];
      if (posts.length < 2) {
        logToFile(`only one post with title ${title}`);
        continue;
      }
      posts.sort((a, b) => new Date(b.updatedAt).getTime() - new Date(a.updatedAt).getTime());
      const postsToDelete = posts.slice(1);
      logToFile(`Deleting ${postsToDelete.length} of ${posts.length}`);
      for (const post of postsToDelete) {
        const query = {
          "query": `mutation { deletePost(id: "${post.id}") { status } }`
        }
        const resultJson = await callBmApi(query, adminToken);
        logJsonToFile({resultJson});
      }
    }
  }

  endTime = new Date();
  logToFile('####################')
  logToFile(errors)
  logToFile(`${errors.length} errors`)
  logToFile(`Duplicate replies deletion complete`);
  logToFile('')

  const timeDetails = formatDuration(startTime, endTime);
  logToFile(`Start Time: ${timeDetails.startTime}`);
  logToFile(`End Time: ${timeDetails.endTime}`);
  logToFile(`Duration: ${timeDetails.duration}`);

  await say(`Duplicate replies deletion complete in ${timeDetails.duration}`)
}

const getBmUserByEmail = async (user: DbUser) => {
  const query = {
    "query": `{ members(limit: 1, filterBy: { key: "email", operator: equals, value: "\\"${user.email}\\""}) { totalCount edges { cursor node { id email name profilePictureId } } } }`
  };

  const resultJson = await callBmApi(query, adminToken);
  return resultJson.data.members.edges[0].node;
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

async function createUserSSOToken(user: DbUser, privateKey: string) {
  const name = user.first_name?.length && user.last_name?.length ?
    user.first_name.trim() + ' ' + user.last_name.trim():
    user.username?.trim();
  
  logToFile(`Creating SSO token for ${name} (${user.email})`)

  const $ = cheerio.load(user.biography?.html || '');
  const bio = $.root().text()

  const joinedWakingUp = user.wu_created_at?.toLocaleDateString('en-US', { month: '2-digit', year: 'numeric' });

  const userData: any = {
    sub: user.wu_uuid,
    email: user.email,
    name,
    bio,
    city: user.mapLocation?.vicinity,
    joinedWakingUp,
    picture: getProfileImageUrl(user),
    iat: Math.round(new Date().getTime() / 1000), // token issue time
    exp: Math.round(new Date().getTime() / 1000) + 60, // token expiration time
    /* Don't assign spaceIds, so they get assigned to the default spaces */
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

  void logToFile("couldn't find mutation or query name for", query);
  throw "couldn't find mutation or query name";
}

async function logBmApiError(errors: any, query: any) {
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
      attempts++;
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
        await logBmApiError(resultJson.errors, query);
        errors.push(resultJson.errors);
      }

      return resultJson;
    } catch (error) {
      logToFile('callBmApi error', error);
      if (error.message === 'fetch failed') {
        logToFile('Retrying due to fetch failed');
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

Vulcan.wuBetterModeDuplicateRepliesDeletion = betterModeDuplicateRepliesDeletion;
