import AbstractRepo from "./AbstractRepo";
import Users from "../../lib/collections/users/collection";
import { UpvotedUser, CommentCountTag, TopCommentedTagUser } from "../../components/users/DialogueMatchingPage";
import {calculateVotePower} from "../../lib/voting/voteTypes";

const GET_USERS_BY_EMAIL_QUERY = `
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)`;

const GET_USER_BY_USERNAME_OR_EMAIL_QUERY = `
SELECT *
FROM "Users"
WHERE username = $1
UNION
SELECT *
FROM "Users"
WHERE LOWER(email) = LOWER($1)
UNION
SELECT *
FROM "Users"
WHERE _id IN (
  SELECT _id
  FROM "Users", UNNEST(emails) unnested
  WHERE UNNESTED->>'address' = $1
)
LIMIT 1
`;

type UserData = {
  _id: string;
  username: string;
  displayName: string;
  name: string;
  post_comment_count: number;
};

export type MongoNearLocation = { type: "Point", coordinates: number[] }
export default class UsersRepo extends AbstractRepo<DbUser> {
  constructor() {
    super(Users);
  }

  getUserByLoginToken(hashedToken: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      SELECT *
      FROM "Users"
      WHERE "services"->'resume'->'loginTokens' @> ('[{"hashedToken": "' || $1 || '"}]')::JSONB
    `, [hashedToken]);
  }
  
  getUsersWhereLocationIsInNotificationRadius(location: MongoNearLocation): Promise<Array<DbUser>> {
    // the notification radius is in miles, so we convert the EARTH_DISTANCE from meters to miles
    return this.any(`
      SELECT *
      FROM "Users"
      WHERE (
        EARTH_DISTANCE(
          LL_TO_EARTH(
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->0)::FLOAT8,
            ("nearbyEventsNotificationsMongoLocation"->'coordinates'->1)::FLOAT8
          ),
          LL_TO_EARTH($1, $2)
        ) * 0.000621371
      ) < "nearbyEventsNotificationsRadius"
    `, [location.coordinates[0], location.coordinates[1]])
  }

  getUserByEmail(email: string): Promise<DbUser | null> {
    return this.oneOrNone(`
      ${GET_USERS_BY_EMAIL_QUERY}
      LIMIT 1
    `, [email]);
  }

  getAllUsersByEmail(email: string): Promise<DbUser[]> {
    return this.any(GET_USERS_BY_EMAIL_QUERY, [email]);
  }

  getUserByUsernameOrEmail(usernameOrEmail: string): Promise<DbUser | null> {
    return this.oneOrNone(GET_USER_BY_USERNAME_OR_EMAIL_QUERY, [usernameOrEmail]);
  }

  clearLoginTokens(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        services,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId]);
  }

  resetPassword(userId: string, hashedPassword: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET services = jsonb_set(
        CASE WHEN services -> 'password' IS NULL THEN
          jsonb_set(
            COALESCE(services, '{}'::JSONB),
            '{password}'::TEXT[],
            jsonb_build_object('bcrypt', $2),
            true
          )
        ELSE
          jsonb_set(
            services,
            '{password, bcrypt}'::TEXT[],
            to_jsonb($2::TEXT),
            true
          )
        END,
        '{resume, loginTokens}'::TEXT[],
        '[]'::JSONB,
        true
      )
      WHERE _id = $1
    `, [userId, hashedPassword]);
  }

  verifyEmail(userId: string): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET emails[1] = jsonb_set(emails[1], '{verified}', 'true'::JSONB, true)
      WHERE _id = $1
    `, [userId]);
  }

  setExpandFrontpageSection(userId: string, section: string, expanded: boolean): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET "expandedFrontpageSections" =
        COALESCE("expandedFrontpageSections", '{}'::JSONB) ||
          fm_build_nested_jsonb(('{' || $2 || '}')::TEXT[], $3::JSONB)
      WHERE "_id" = $1
    `, [userId, section, String(expanded)]);
  }

  removeAlignmentGroupAndKarma(userId: string, reduceAFKarma: number): Promise<null> {
    return this.none(`
      UPDATE "Users"
      SET
        "groups" = array_remove("groups", 'alignmentVoters'),
        "afKarma" = "afKarma" - $2
      WHERE _id = $1
    `, [userId, reduceAFKarma]);
  }

  private getSearchDocumentQuery(): string {
    return `
      SELECT
        u."_id",
        u."_id" AS "objectID",
        u."username",
        u."displayName",
        u."createdAt",
        EXTRACT(EPOCH FROM u."createdAt") * 1000 AS "publicDateMs",
        COALESCE(u."isAdmin", FALSE) AS "isAdmin",
        COALESCE(u."deleted", FALSE) AS "deleted",
        COALESCE(u."deleteContent", FALSE) AS "deleteContent",
        u."profileImageId",
        u."biography"->>'html' AS "bio",
        u."howOthersCanHelpMe"->>'html' AS "howOthersCanHelpMe",
        u."howICanHelpOthers"->>'html' AS "howICanHelpOthers",
        COALESCE(u."karma", 0) AS "karma",
        u."slug",
        u."jobTitle",
        u."organization",
        u."careerStage",
        u."website",
        u."groups",
        u."groups" @> ARRAY['alignmentForum'] AS "af",
        u."profileTagIds" AS "tags",
        CASE WHEN u."mapLocation"->'geometry'->'location' IS NULL THEN NULL ELSE
          JSONB_BUILD_OBJECT(
            'type', 'point',
            'coordinates', JSONB_BUILD_ARRAY(
              u."mapLocation"->'geometry'->'location'->'lng',
              u."mapLocation"->'geometry'->'location'->'lat'
          )) END AS "_geoloc",
        u."mapLocation"->'formatted_address' AS "mapLocationAddress",
        u."first_name" AS "firstName",
        u."last_name" AS "lastName",
        u."wu_created_at" AS "wuCreatedAt",
        u."acceptedTos" AS "completedOnboarding",
        NOW() AS "exportedAt"
      FROM "Users" u
    `;
  }

  getSearchDocumentById(id: string): Promise<AlgoliaUser> {
    return this.getRawDb().one(`
      ${this.getSearchDocumentQuery()}
      WHERE u."_id" = $1
    `, [id]);
  }

  getSearchDocuments(limit: number, offset: number): Promise<AlgoliaUser[]> {
    return this.getRawDb().any(`
      ${this.getSearchDocumentQuery()}
      WHERE u."displayName" IS NOT NULL
      ORDER BY u."createdAt" DESC
      LIMIT $1
      OFFSET $2
    `, [limit, offset]);
  }

  async countSearchDocuments(): Promise<number> {
    const {count} = await this.getRawDb().one(`SELECT COUNT(*) FROM "Users"`);
    return count;
  }
  
  async getRandomActiveUser(): Promise<DbUser> {
    return this.one(`
      SELECT u.*
      FROM "Users" u
      JOIN (
        SELECT "userId", MAX("lastUpdated") AS max_last_updated
        FROM "ReadStatuses"
        GROUP BY "userId"
      ) rs
      ON rs."userId" = u."_id"
      WHERE COALESCE(u."deleted", FALSE) = FALSE
      AND rs.max_last_updated > NOW() - INTERVAL '1 month'
      ORDER BY RANDOM()
      LIMIT 1;
    `);
  }
  
  async getRandomActiveAuthor(): Promise<DbUser> {
    return this.one(`
      SELECT u.*
      FROM "Users" u
      JOIN (
        SELECT "userId", MAX("createdAt") AS max_created_at
        FROM "Comments"
        GROUP BY "userId"
      ) c
      ON c."userId" = u."_id"
      JOIN (
        SELECT "userId", MAX("postedAt") AS max_posted_at
        FROM "Posts"
        GROUP BY "userId"
      ) p
      ON p."userId" = u."_id"
      WHERE COALESCE(u."deleted", FALSE) = FALSE
      AND (c.max_created_at > NOW() - INTERVAL '1 month' OR p.max_posted_at > NOW() - INTERVAL '1 month')
      ORDER BY RANDOM()
      LIMIT 1;
    `);
  }

  async getUsersWhoHaveMadeDialogues(): Promise<DbUser[]> {
    return this.getRawDb().any(`
      WITH all_dialogue_authors AS
        (SELECT (UNNESTED->>'userId') AS _id
            FROM "Posts" p, UNNEST("coauthorStatuses") unnested
            WHERE p."collabEditorDialogue" IS TRUE 
            AND p."draft" IS FALSE
        UNION
        SELECT p."userId" as _id
            FROM "Posts" p
            WHERE p."collabEditorDialogue" IS TRUE
            AND p."draft" IS FALSE
        )
      SELECT u.*
      FROM "Users" u
      INNER JOIN all_dialogue_authors ON all_dialogue_authors._id = u._id
    `)
  }

  async getUsersWhoHaveOptedInToDialogueFacilitation(): Promise<DbUser[]> {
    return this.getRawDb().any(`
        SELECT *
        FROM "Users" u
        WHERE u."optedInToDialogueFacilitation" IS TRUE
    `)
  }  

  async getUsersTopUpvotedUsers(user:DbUser, limit = 20, recencyLimitDays = 10): Promise<UpvotedUser[]> {
    const karma = user?.karma ?? 0
    const smallVotePower = calculateVotePower(karma, "smallUpvote");
    const bigVotePower = calculateVotePower(karma, "bigUpvote");
    
    return this.getRawDb().any(`
      WITH "CombinedVotes" AS (
      -- Joining Users with Posts and Votes
      SELECT
          v.power AS vote_power,
          u._id AS user_id,
          u.username AS user_username,
          u."displayName" AS user_displayName,
          CASE
              WHEN v."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -$3
              WHEN v."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -$2
              WHEN v."extendedVoteType"->>'agreement' = 'neutral' THEN 0
              WHEN v."extendedVoteType"->>'agreement' = 'smallUpvote' THEN $2
              WHEN v."extendedVoteType"->>'agreement' = 'bigUpvote' THEN $3
              ELSE 0
          END AS agreement_value
        FROM "Users" u
        INNER JOIN "Posts" p ON u._id = p."userId"
        INNER JOIN "Votes" v ON p._id = v."documentId"
        WHERE
            v."userId" = $1
            AND u._id != $1
            AND v."votedAt" > NOW() - INTERVAL '1.5 years'
            AND v."cancelled" IS NOT TRUE

        UNION ALL
    
        -- Joining Users with Comments and Votes
        SELECT
            v.power AS vote_power,
            u._id AS user_id,
            u.username AS user_username,
            u."displayName" AS user_displayName,
            CASE
                WHEN v."extendedVoteType"->>'agreement' = 'bigDownvote' THEN -$3
                WHEN v."extendedVoteType"->>'agreement' = 'smallDownvote' THEN -$2
                WHEN v."extendedVoteType"->>'agreement' = 'neutral' THEN 0
                WHEN v."extendedVoteType"->>'agreement' = 'smallUpvote' THEN $2
                WHEN v."extendedVoteType"->>'agreement' = 'bigUpvote' THEN $3
                ELSE 0
            END AS agreement_value
        FROM "Users" u
        INNER JOIN "Comments" c ON u._id = c."userId"
        INNER JOIN "Votes" v ON c._id = v."documentId"
        WHERE
            v."userId" = $1
            AND u._id != $1
            AND v."votedAt" > NOW() - INTERVAL '1.5 years'
            AND v."cancelled" IS NOT TRUE
    ),

    "UserChecks" AS (
      SELECT
          u._id,
          COALESCE(
              EXISTS (
                  SELECT 1
                  FROM "DialogueChecks" as dc
                  WHERE
                      dc."userId" = u._id
                      AND "checkedAt" > NOW() - INTERVAL '$5 days'
              ),
              FALSE
          ) AS recently_active_matchmaking
      FROM "Users" as u
    )
  
    SELECT
      user_id AS _id,
      user_username AS username,
      user_displayName AS "displayName",
      SUM(vote_power) AS total_power,
      ARRAY_AGG(vote_power) AS power_values,
      COUNT(vote_power) AS vote_counts,
      SUM(agreement_value) AS total_agreement,
      ARRAY(
          SELECT val
          FROM UNNEST(ARRAY_AGG(agreement_value)) AS val
          WHERE val != 0
      ) AS agreement_values,
      uc.recently_active_matchmaking
    FROM "CombinedVotes" as cv
    LEFT JOIN "UserChecks" AS uc ON cv.user_id = uc._id
    GROUP BY 
      user_id, 
      user_username, 
      user_displayName,
      uc.recently_active_matchmaking
    HAVING SUM(vote_power) > 1
    ORDER BY total_power DESC
    LIMIT $4;
      `, [user._id, smallVotePower, bigVotePower, limit, recencyLimitDays])
  }


  async getDialogueMatchedUsers(userId: string): Promise<DbUser[]> {
    return this.any(`
      SELECT DISTINCT(u.*)
      FROM "DialogueChecks" other_users_checks
      JOIN "DialogueChecks" current_user_checks
      -- Join such that there must exist reciprocal checks
      ON (
        other_users_checks."targetUserId" = current_user_checks."userId"
        AND current_user_checks."targetUserId" = other_users_checks."userId"
        AND other_users_checks.checked IS TRUE
        AND current_user_checks.checked IS TRUE
      )
      JOIN "Users" u
      -- Given those, join for users who've created checks on you
      ON (
        other_users_checks."userId" = u._id
        AND other_users_checks."targetUserId" = $1
        AND current_user_checks."userId" = $1
      )
    `, [userId]);
  }

  async getActiveDialogueMatchSeekers(limit: number): Promise<DbUser[]> {
    return this.manyOrNone(`
      SELECT  
        u.*,
        MAX(dc."checkedAt") AS "mostRecentCheckedAt"
      FROM public."Users" AS u
      LEFT JOIN public."DialogueChecks" AS dc ON u._id = dc."userId"
      WHERE u."optedInToDialogueFacilitation" IS TRUE OR dc."userId" IS NOT NULL
      GROUP BY u._id
      ORDER BY "mostRecentCheckedAt" ASC
      LIMIT $1;
    `, [limit])
  }
}
