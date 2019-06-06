import { registerMigration } from './migrationUtils';
import { recomputeDenormalizedValues } from '../scripts/recomputeDenormalized';

registerMigration({
  name: "updateMessageCounts",
  idempotent: true,
  action: async () => {
    await recomputeDenormalizedValues({collectionName: "Conversations", fieldName: "messageCount"});
  }
});
