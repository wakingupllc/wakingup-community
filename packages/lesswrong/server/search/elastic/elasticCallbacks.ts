import {
  SearchIndexCollectionName,
  searchIndexedCollectionNames,
} from "../../../lib/search/searchUtil";
import { getCollectionHooks } from "../../mutationCallbacks";
import ElasticClient from "./ElasticClient";
import ElasticExporter from "./ElasticExporter";
import { isElasticEnabled } from "./elasticSettings";
import {Comments} from '../../../lib/collections/comments'

export const elasticSyncDocument = (
  collectionName: SearchIndexCollectionName,
  documentId: string,
) => {
  try {
    const client = new ElasticClient();
    const exporter = new ElasticExporter(client);
    void exporter.updateDocument(collectionName, documentId);
  } catch (e) {
    // eslint-disable-next-line no-console
    console.error(`[${collectionName}] Failed to index Elasticsearch document:`, e);
  }
}

if (isElasticEnabled) {
  for (const collectionName of searchIndexedCollectionNames) {
    const callback = ({_id}: DbObject) => elasticSyncDocument(collectionName, _id);
    getCollectionHooks(collectionName).createAfter.add(callback);
    getCollectionHooks(collectionName).updateAfter.add(callback);
  }

  getCollectionHooks('Posts').editAsync.add(
    async function UpdateCommentsIfPostIsDraftedOrDeleted(newPost: DbPost, oldPost: DbPost) {
      const postVisibilityUnchanged = oldPost.draft === newPost.draft && oldPost.deletedDraft === newPost.deletedDraft
      if (postVisibilityUnchanged) return

      const comments = Comments.find({postId: newPost._id}, {projection: {_id: 1}})
      if (!(await comments.count())) return

      /**
       * Note this can become a performance issue if we have a lot of comments on a post
       * we may consider using https://www.elastic.co/guide/en/elasticsearch/reference/current/docs-update-by-query.html
       * in the future to do more granular updates
       */
      (await comments.fetch()).forEach(comment => {
        elasticSyncDocument('Comments', comment._id)
      })
    })
}
