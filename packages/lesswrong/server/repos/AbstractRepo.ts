import { getSqlClient } from "../../lib/sql/sqlClient";
import PgCollection from "../../lib/sql/PgCollection";

/**
 * abstractRepo provides the superclass from which all of our collection
 * repositories are descended. Any common properties or functions
 * should be added here.
 *
 * To make the repo available in GraphQL resolvers, add it to `getAllRepos`
 * in index.ts
 */
export default abstract class AbstractRepo<T extends DbObject> {
  protected collection: CollectionBase<T>;
  private db: SqlClient;

  constructor(collection: CollectionBase<T>, sqlClient?: SqlClient) {
    this.collection = collection;
    const db = sqlClient ?? getSqlClient();
    if (db) {
      this.db = db;
    } else {
      throw new Error("Instantiating repo without a SQL client");
    }
  }

  protected getCollection(): PgCollection<T> {
    // TODO: This check can be moved into the constructor once LessWrong
    // are on Postgres
    if (!this.collection.isPostgres()) {
      throw new Error("Collecton is not a Postgres collection");
    }
    return this.collection as unknown as PgCollection<T>;
  }

  /**
   * For queries that return type T (eg; a query in PostsRepo returning a DbPost or
   * DbPost[]) we should use this.one, this.many, this.any, etc. below as we can apply
   * automatic post-processing and there's more type safety. Some queries, however,
   * return different specialized types (such as CommentKarmaChanges) which should
   * instead use this.getRawDb().one, this.getRawDb().many, etc.
   */
  protected getRawDb(): SqlClient {
    return this.db;
  }

  protected none(sql: string, args: SqlQueryArgs = []): Promise<null> {
    return this.db.none(sql, args, () => `${sql}: ${JSON.stringify(args)}`);
  }

  protected one(sql: string, args: SqlQueryArgs = []): Promise<T> {
    return this.postProcess(this.db.one(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected oneOrNone(sql: string, args: SqlQueryArgs = []): Promise<T | null> {
    return this.postProcess(this.db.oneOrNone(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected any(sql: string, args: SqlQueryArgs = []): Promise<T[]> {
    return this.postProcess(this.db.any(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected many(sql: string, args: SqlQueryArgs = []): Promise<T[]> {
    return this.postProcess(this.db.many(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  protected manyOrNone(sql: string, args: SqlQueryArgs = []): Promise<T[]> {
    return this.postProcess(this.db.manyOrNone(sql, args, () => `${sql}: ${JSON.stringify(args)}`));
  }

  private postProcess(promise: Promise<T>): Promise<T>;
  private postProcess(promise: Promise<T | null>): Promise<T | null>;
  private postProcess(promise: Promise<T[]>): Promise<T[]>;
  private postProcess(promise: Promise<T[] | null>): Promise<T[] | null>;
  private async postProcess(promise: Promise<T | T[] | null>): Promise<T | T[] | null> {
    const data = await promise;
    const {postProcess} = this.getCollection();
    if (data && postProcess) {
      return Array.isArray(data)
        ? data.map((item) => postProcess(item))
        : postProcess(data);
    }
    return data;
  }
}
