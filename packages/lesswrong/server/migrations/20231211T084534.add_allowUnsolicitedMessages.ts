/**
 * Generated on 2023-12-11T08:45:34.368Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * index 32da00fc9f..900061e456 100644
 * --- a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql
 * +++ b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 661ad6cacfc4b24f6f6adc2135212254
 * -
 * --- Accepted on 2023-11-17T19:44:20.000Z by 20231117T194420.update_notification_defaults.ts
 * +-- Overall schema hash: f07cca38120c1028d2afafd499ea170f
 *  
 * @@ -1031,3 +1029,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 62a2c6ad3605bbbd01f6bac610ab2548
 * +-- Schema for "Users", hash: c716555444aaafc5000b4d323928a0cd
 *  CREATE TABLE "Users" (
 * @@ -1046,3 +1044,3 @@ CREATE TABLE "Users" (
 *      "lwWikiImport" bool,
 * -    "theme" jsonb DEFAULT '{"name":"default"}' ::jsonb,
 * +    "theme" jsonb DEFAULT '{"name":"auto"}' ::jsonb,
 *      "lastUsedTimezone" text,
 * @@ -1237,2 +1235,3 @@ CREATE TABLE "Users" (
 *      "wu_subscription_active" bool,
 * +    "allowUnsolicitedMessages" bool DEFAULT true,
 *      "schemaVersion" double precision DEFAULT 1,
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "f07cca38120c1028d2afafd499ea170f";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, 'allowUnsolicitedMessages');

    await db.any(`
      UPDATE "Users"
      SET "allowUnsolicitedMessages" = TRUE
    `);
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, 'allowUnsolicitedMessages');
  }
}
