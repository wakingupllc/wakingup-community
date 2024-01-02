/**
 * Generated on 2024-01-02T05:24:45.901Z by `yarn makemigrations`
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
export const acceptsSchemaHash = "2948cc8a722d79520af6900e47ab87b6";

export const up = async ({db}: MigrationContext) => {
  // We're not actually adding a constraint on the table, just relying on server validation.
  // See https://github.com/wakingupllc/wakingup-community/pull/198#issuecomment-1873641935 for reasoning behind it
}

export const down = async ({db}: MigrationContext) => {
}
