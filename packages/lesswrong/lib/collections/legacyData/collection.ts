import { createCollection } from '../../vulcan-lib';
import { addUniversalFields } from '../../collectionUtils';
import { ensureIndex } from '../../collectionIndexUtils'

const schema: SchemaType<DbLegacyData> = {
  objectId: {
    type: String,
    nullable: false,
  },
  collectionName: {
    type: String,
    nullable: false,
  },
};

export const LegacyData: LegacyDataCollection = createCollection({
  collectionName: "LegacyData",
  typeName: "LegacyData",
  collectionType: 'pg',
  schema
});

addUniversalFields({collection: LegacyData});
ensureIndex(LegacyData, {objectId:1});

export default LegacyData;
