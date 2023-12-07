import CollectionsRepo from "./CollectionsRepo";
import CommentsRepo from "./CommentsRepo";
import ConversationsRepo from "./ConversationsRepo";
import DatabaseMetadataRepo from "./DatabaseMetadataRepo";
import DebouncerEventsRepo from "./DebouncerEventsRepo";
import DialogueChecksRepo from "./DialogueChecksRepo";
import ElectionCandidatesRepo from "./ElectionCandidatesRepo";
import LocalgroupsRepo from "./LocalgroupsRepo";
import PostEmbeddingsRepo from "./PostEmbeddingsRepo";
import PostRecommendationsRepo from "./PostRecommendationsRepo";
import PostRelationsRepo from "./PostRelationsRepo";
import PostsRepo from "./PostsRepo";
import SequencesRepo from "./SequencesRepo";
import TagsRepo from "./TagsRepo";
import UsersRepo from "./UsersRepo";
import VotesRepo from "./VotesRepo";

declare global {
  type Repos = ReturnType<typeof getAllRepos>;
}

const getAllRepos = () => ({
  comments: new CommentsRepo(),
  collections: new CollectionsRepo(),
  conversations: new ConversationsRepo(),
  databaseMetadata: new DatabaseMetadataRepo(),
  debouncerEvents: new DebouncerEventsRepo(),
  dialogueChecks: new DialogueChecksRepo(),
  electionCandidates: new ElectionCandidatesRepo(),
  localgroups: new LocalgroupsRepo(),
  PostEmbeddingsRepo: new PostEmbeddingsRepo(),
  postRecommendations: new PostRecommendationsRepo(),
  postRelations: new PostRelationsRepo(),
  posts: new PostsRepo(),
  sequences: new SequencesRepo(),
  tags: new TagsRepo(),
  users: new UsersRepo(),
  votes: new VotesRepo(),
} as const);

export {
  CommentsRepo,
  ConversationsRepo,
  DatabaseMetadataRepo,
  DebouncerEventsRepo,
  DialogueChecksRepo,
  ElectionCandidatesRepo,
  LocalgroupsRepo,
  PostEmbeddingsRepo,
  PostRecommendationsRepo,
  PostRelationsRepo,
  PostsRepo,
  SequencesRepo,
  TagsRepo,
  UsersRepo,
  VotesRepo,
  getAllRepos,
};
