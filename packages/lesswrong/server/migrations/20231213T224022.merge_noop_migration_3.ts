/**
 * Generated on 2023-12-13T22:40:22.947Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "30e601658df4d3f215cacd0e36bd5234";

export const up = async ({db}: MigrationContext) => {
  // This is a fake migration after forcing out of order migrations during merge
}

export const down = async ({db}: MigrationContext) => {
  // TODO, not required
}
