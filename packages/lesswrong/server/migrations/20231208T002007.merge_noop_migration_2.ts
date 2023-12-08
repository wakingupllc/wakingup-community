/**
 * Generated on 2023-12-08T00:20:07.273Z by `yarn makemigrations`
 * The following schema changes were detected:
 * -------------------------------------------
 * ***Diff too large to display***
 * -------------------------------------------
 * (run `git diff --no-index schema/accepted_schema.sql schema/schema_to_accept.sql` to see this more clearly)
 *
 * - [ ] Write a migration to represent these changes
 * - [ ] Rename this file to something more readable
 * - [ ] Uncomment `acceptsSchemaHash` below
 * - [ ] Run `yarn acceptmigrations` to update the accepted schema hash (running makemigrations again will also do this)
 */
export const acceptsSchemaHash = "6284e79326a901d84a6a557b046429bd";

export const up = async ({db}: MigrationContext) => {
  // This is a fake migration after forcing out of order migrations during merge
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
