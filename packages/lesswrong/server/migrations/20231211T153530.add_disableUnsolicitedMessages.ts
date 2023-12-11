/**
 * Generated on 2023-12-11T15:35:30.568Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * diff --git a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * index 0c4a6bb006..6cd1582cf1 100644
 * --- a/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/accepted_schema.sql
 * +++ b/Users/michaelkeenan/Programming/projects/ForumMagnum2/schema/schema_to_accept.sql
 * @@ -4,5 +4,3 @@
 *  --
 * --- Overall schema hash: 661ad6cacfc4b24f6f6adc2135212254
 * -
 * --- Accepted on 2023-11-17T19:44:20.000Z by 20231117T194420.update_notification_defaults.ts
 * +-- Overall schema hash: 7733bbbe246229732fd60ecbb0654020
 *  
 * @@ -1031,3 +1029,3 @@ CREATE TABLE "UserTagRels" (
 *  
 * --- Schema for "Users", hash: 62a2c6ad3605bbbd01f6bac610ab2548
 * +-- Schema for "Users", hash: 827f2361dd81a234f8ebdd8895b0d70e
 *  CREATE TABLE "Users" (
 * @@ -1046,3 +1044,3 @@ CREATE TABLE "Users" (
 *      "lwWikiImport" bool,
 * -    "theme" jsonb DEFAULT '{"name":"default"}' ::jsonb,
 * +    "theme" jsonb DEFAULT '{"name":"auto"}' ::jsonb,
 *      "lastUsedTimezone" text,
 * @@ -1237,2 +1235,3 @@ CREATE TABLE "Users" (
 *      "wu_subscription_active" bool,
 * +    "disableUnsolicitedMessages" bool DEFAULT false,
 *      "schemaVersion" double precision DEFAULT 1,
 * @@ -1270 +1269,2 @@ CREATE TABLE "Votes" (
 *  );
 * +
 * 
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "7733bbbe246229732fd60ecbb0654020";

import Users from "../../lib/collections/users/collection";
import { addField, dropField } from "./meta/utils";

export const up = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await addField(db, Users, 'disableUnsolicitedMessages');
  }
}

export const down = async ({db}: MigrationContext) => {
  if (Users.isPostgres()) {
    await dropField(db, Users, 'disableUnsolicitedMessages');
  }
}
