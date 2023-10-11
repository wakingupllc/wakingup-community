import { createAndSetToken } from '../vulcan-lib/apollo-server/authentication';
import { Users } from '../../lib/collections/users/collection';
import { DatabaseServerSetting } from '../databaseSettings';
import { createMutator, updateMutator } from '../vulcan-lib/mutators';
import { userFindOneByEmail } from "../commonQueries";
import request from 'request';
import { Utils, slugify, addGraphQLMutation, addGraphQLSchema, addGraphQLResolvers } from '../vulcan-lib';
import { isProduction } from '../../lib/executionEnvironment';
import type { AddMiddlewareType } from '../apolloServer';

// TODO: This isn't actually middleware. Put it somewhere else.

export const wuMiddleware = (addMiddleware: AddMiddlewareType) => {
  // app.use();
};

const wakingUpKeySetting = new DatabaseServerSetting<string | null>('wakingUpKey', null)

function isValidWuUser(wuUser: WuUserData) {
  return (!!wuUser.email)
}

async function getWakingUpUserData(email: string): Promise<any> {
  const wakingUpKey = wakingUpKeySetting.get()

  // // hardcoded response for testing
  // return Promise.resolve({
  //   "avatar": "https://d6ttkheexoy1x.cloudfront.net/shared/images/1657_e80a7cad-7dd1-405c-906e-2476fa7fb3f2",
  //   "city": "Berkeley",
  //   "created_at": "2019-05-07T15:39:56.000Z",
  //   "email": email,
  //   "first_name": "Michael",
  //   "forum_access": false,
  //   "has_ever_been_paid_subscriber": true,
  //   "last_name": "Keenan",
  //   "subscription_expires_at": "2024-07-13T21:19:27.000Z",
  //   "subscription_status": "ACTIVE",
  //   "uuid": "3d7016ab-ed98-4099-95ff-f567561bd1e2"
  // })

  // TODO: make this URL configurable
  const url = `https://api.dev.wakingup.com/community/users/${email}`;
  const headers = {
    'x-community-key': wakingUpKey,
  };
  const options = {
    url,
    headers,
    json: true,
  };
  return new Promise((resolve, reject) => {
    request.get(options, (error, response, body) => {
      if (error) {
        reject(error);
      } else {
        resolve(body);
      }
    });
  });
}

/* Example data:
{
    "avatar": "https://d6ttkheexoy1x.cloudfront.net/shared/images/1657_e80a7cad-7dd1-405c-906e-2476fa7fb3f2",
    "city": "Gijon",
    "created_at": "2019-05-07T15:39:56.000Z",
    "email": "jose@fivekoalas.com",
    "first_name": "Jose",
    "forum_access": false,
    "has_ever_been_paid_subscriber": true,
    "last_name": "Dev",
    "subscription_expires_at": "2024-07-13T21:19:27.000Z",
    "subscription_status": "ACTIVE",
    "uuid": "3d7016ab-ed98-4099-95ff-f567561bd1e2"
}
*/

type WuUserData = {
  avatar?: string,
  city?: string,
  created_at?: string,
  email?: string,
  first_name?: string,
  forum_access?: boolean,
  has_ever_been_paid_subscriber?: boolean,
  last_name?: string,
  subscription_expires_at?: string,
  subscription_status?: string,
  uuid?: string,
  message?: string,
}

// TODO: maybe rethink this being async; see how createOAuthUserHandler
// isn't async but returns a function that is

async function syncOrCreateWuUser(wuUser: WuUserData): Promise<DbUser> {
  // base this on createOAuthUserHandler
  let user = await Users.findOne({'wu_uuid': wuUser.uuid})
  if (user) {
    user = await syncWuUser(user, wuUser)
  } else {
    user = await createWuUser(wuUser)
  }

  return user
}

function wuUserFields(wuUser: WuUserData) {
  return {
    email: wuUser.email,
    first_name: wuUser.first_name,
    last_name: wuUser.last_name,
    avatar: wuUser.avatar,
    wu_created_at: new Date(wuUser.created_at!),
    wu_forum_access: wuUser.forum_access,
    wu_has_ever_been_paid_subscriber: wuUser.has_ever_been_paid_subscriber,
    wu_subscription_expires_at: new Date(wuUser.subscription_expires_at!),
    wu_subscription_active: wuUser.subscription_status === 'ACTIVE',
  };
}

async function syncWuUser(user: DbUser, wuUser: WuUserData): Promise<DbUser> {
  const requiredFields = ['email', 'created_at', 'subscription_expires_at', 'subscription_status', 'forum_access'];
  for (const field of requiredFields) {
    if (!wuUser[field as keyof WuUserData]) {
      throw new Error(`wuUser.${field} is required`);
    }
  }

  const updatedUserResponse = await updateMutator({
    collection: Users,
    documentId: user._id,
    set: wuUserFields(wuUser),
    validate: false
  })

  return updatedUserResponse.data
}

async function createWuUser(wuUser: WuUserData): Promise<DbUser> {
  const { data: userCreated } = await createMutator({
    collection: Users,
    document: {
      ...wuUserFields(wuUser),
      displayName: wuDisplayName(wuUser),
      username: await Utils.getUnusedSlugByCollectionName("Users", slugify(wuDisplayName(wuUser))),
    },
    validate: false,
    currentUser: null
  })
  return userCreated
}

function wuDisplayName(wuUser: WuUserData): string {
  return `${wuUser.first_name} ${wuUser.last_name}`
}

const requestedCodeData = `type requestedCodeData {
  result: String
}`

const loginData = `type LoginReturnData2 {
  token: String
}`

addGraphQLSchema(loginData);
addGraphQLSchema(requestedCodeData);

const authenticationResolvers = {
  Mutation: {
    async requestLoginCode(root: void, { email }: {email: string}, { req, res }: ResolverContext) {
      if (!email) {
        throw new Error('Email missing')
      }
    
      const oneTimeCode = Math.floor(1000 + (Math.random() * 9000)).toString();
    
      const wuUser = await getWakingUpUserData(email);
      console.log("###Got WU user###");
      console.log({wuUser});
    
      if (isValidWuUser(wuUser)) {
        const user = await syncOrCreateWuUser(wuUser)
        await Users.rawUpdateOne({_id: user._id}, {$addToSet: {"services.wakingUp.oneTimeCode": oneTimeCode}});
      } else {
        console.log("Not a WU user")
      }
      return { result: "success" }
    },
    
    async codeLogin(root: void, { email, code }: {email: string, code: string}, { req, res }: ResolverContext) {
      const user = await userFindOneByEmail(email);
      const validCode = user && code?.length > 0 && user.services?.wakingUp?.oneTimeCode === code;
      // TODO: restrict this in production
      // const devCodeOkay = user && !isProduction && code === '1234';
      const devCodeOkay = user && code === '1234';

      if (validCode || devCodeOkay) {
        await Users.rawUpdateOne({_id: user._id}, {$set: {"services.wakingUp.oneTimeCode": null}});
        const token = await createAndSetToken(req, res, user)
        return { token };
      } else {
        throw new Error('Invalid one-time code');
      }
    },
  } 
};

addGraphQLResolvers(authenticationResolvers);

addGraphQLMutation('requestLoginCode(email: String): requestedCodeData');
addGraphQLMutation('codeLogin(email: String, code: String): LoginReturnData2');
