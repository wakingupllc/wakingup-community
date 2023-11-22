import { createPaginatedResolver } from './paginatedResolver';

createPaginatedResolver({
  name: "UserVotesWithNonDeletedDocuments",
  graphQLType: "Vote",
  callback: async (
    context: ResolverContext,
    limit: number,
  ): Promise<DbVote[]> => {
    const {currentUser} = context;
    return context.repos.votes.getUserVotesWithNonDeletedDocuments({userId: currentUser!._id, limit})
  },
});
