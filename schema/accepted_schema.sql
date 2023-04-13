-- GENERATED FILE
-- Do not edit this file directly. Instead, start a server and run "yarn makemigrations"
-- as described in the README. This file should nevertheless be checked in to version control.
--
-- Overall schema hash: 64c57945e3105d8daf5be8d51a1ee559

-- Accepted on 2023-04-12T18:58:46.000Z by 20230412T185846.add_modGPTAnalysis.ts

-- Schema for "AdvisorRequests", hash: 7d8b2c2f86db29368d55481bc888c1d9
CREATE TABLE "AdvisorRequests" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "interestedInMetaculus" bool DEFAULT false,
    "jobAds" jsonb,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Bans", hash: a277d598355207b56e7ccd21e1e46011
CREATE TABLE "Bans" (
    _id varchar(27) PRIMARY KEY,
    "expirationDate" timestamptz,
    "userId" varchar(27),
    "ip" text,
    "reason" text,
    "comment" text,
    "properties" jsonb,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Books", hash: e14dfdf561ea85845a7e08eb7058bf8a
CREATE TABLE "Books" (
    _id varchar(27) PRIMARY KEY,
    "postedAt" timestamptz,
    "title" text,
    "subtitle" text,
    "tocTitle" text,
    "collectionId" varchar(27) NOT NULL,
    "number" double precision,
    "postIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "sequenceIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "displaySequencesAsGrid" bool,
    "hideProgressBar" bool,
    "showChapters" bool,
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Chapters", hash: 8cad2c6f9ed2f158af8270acca921dec
CREATE TABLE "Chapters" (
    _id varchar(27) PRIMARY KEY,
    "title" text,
    "subtitle" text,
    "number" double precision,
    "sequenceId" varchar(27),
    "postIds" varchar(27)[] NOT NULL DEFAULT '{}',
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "ClientIds", hash: aae19b103f48347cbd022e63e26ced3b
CREATE TABLE "ClientIds" (
    _id varchar(27) PRIMARY KEY,
    "clientId" text,
    "firstSeenReferrer" text,
    "firstSeenLandingPage" text,
    "userIds" text[] DEFAULT '{}' ::text[],
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Collections", hash: c0db4c5ef97068e6d7fe9be058ccac5b
CREATE TABLE "Collections" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "title" text NOT NULL,
    "slug" text NOT NULL,
    "gridImageId" text,
    "firstPageLink" text,
    "hideStartReadingButton" bool,
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "CommentModeratorActions", hash: e43efff233dd4c04432ce7930aadd32d
CREATE TABLE "CommentModeratorActions" (
    _id varchar(27) PRIMARY KEY,
    "commentId" varchar(27),
    "type" text,
    "endedAt" timestamptz,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Comments", hash: aff61766f86b6129215dc4cd710aa12a
CREATE TABLE "Comments" (
    _id varchar(27) PRIMARY KEY,
    "parentCommentId" varchar(27),
    "topLevelCommentId" varchar(27),
    "postedAt" timestamptz,
    "author" text,
    "postId" varchar(27),
    "tagId" varchar(27),
    "tagCommentType" text DEFAULT 'DISCUSSION',
    "subforumStickyPriority" double precision,
    "userId" varchar(27),
    "userIP" text,
    "userAgent" text,
    "referrer" text,
    "authorIsUnreviewed" bool DEFAULT false,
    "answer" bool DEFAULT false,
    "parentAnswerId" varchar(27),
    "directChildrenCount" double precision DEFAULT 0,
    "descendentCount" double precision DEFAULT 0,
    "shortform" bool,
    "nominatedForReview" text,
    "reviewingForReview" text,
    "lastSubthreadActivity" timestamptz,
    "postVersion" text,
    "promoted" bool,
    "promotedByUserId" varchar(27),
    "promotedAt" timestamptz,
    "hideKarma" bool,
    "legacy" bool DEFAULT false,
    "legacyId" text,
    "legacyPoll" bool DEFAULT false,
    "legacyParentId" text,
    "retracted" bool DEFAULT false,
    "deleted" bool DEFAULT false,
    "deletedPublic" bool DEFAULT false,
    "deletedReason" text,
    "deletedDate" timestamptz,
    "deletedByUserId" varchar(27),
    "spam" bool DEFAULT false,
    "repliesBlockedUntil" timestamptz,
    "needsReview" bool,
    "reviewedByUserId" varchar(27),
    "hideAuthor" bool DEFAULT false,
    "moderatorHat" bool DEFAULT false,
    "hideModeratorHat" bool,
    "isPinnedOnProfile" bool DEFAULT false,
    "title" varchar(500),
    "relevantTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "debateResponse" bool,
    "rejected" bool DEFAULT false,
    "modGPTAnalysis" text,
    "modGPTRecommendation" text,
    "rejectedByUserId" varchar(27),
    "af" bool DEFAULT false,
    "suggestForAlignmentUserIds" text[] DEFAULT '{}' ::text[],
    "reviewForAlignmentUserId" text,
    "afDate" timestamptz,
    "moveToAlignmentUserId" varchar(27),
    "agentFoundationsId" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "contents" jsonb,
    "contents_latest" text,
    "pingbacks" jsonb,
    "voteCount" double precision DEFAULT 0,
    "baseScore" double precision DEFAULT 0,
    "extendedScore" jsonb,
    "score" double precision DEFAULT 0,
    "inactive" bool,
    "afBaseScore" double precision,
    "afExtendedScore" jsonb,
    "afVoteCount" double precision
);

-- Schema for "Conversations", hash: cd065467ee9421938d204e95ec44267e
CREATE TABLE "Conversations" (
    _id varchar(27) PRIMARY KEY,
    "title" text,
    "participantIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "latestActivity" timestamptz,
    "af" bool,
    "messageCount" double precision DEFAULT 0,
    "moderator" bool,
    "archivedByIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "CronHistories", hash: ba2f120c4f44559c4e5f0f1853bf52df
CREATE TABLE "CronHistories" (
    _id varchar(27) PRIMARY KEY,
    "intendedAt" timestamptz NOT NULL,
    "name" text NOT NULL,
    "startedAt" timestamptz NOT NULL,
    "finishedAt" timestamptz,
    "result" jsonb
);

-- Schema for "DatabaseMetadata", hash: cab758939284adf04437d3cbede97793
CREATE TABLE "DatabaseMetadata" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "value" jsonb,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "DebouncerEvents", hash: 9f0ca64ef7311df82d38a5fba9ec6b98
CREATE TABLE "DebouncerEvents" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "af" bool,
    "dispatched" bool,
    "failed" bool,
    "delayTime" timestamptz,
    "upperBoundTime" timestamptz,
    "key" text,
    "pendingEvents" text[],
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "EmailTokens", hash: e5ad1bb9271a861a3a69375cabb71b64
CREATE TABLE "EmailTokens" (
    _id varchar(27) PRIMARY KEY,
    "token" text,
    "tokenType" text,
    "userId" varchar(27),
    "usedAt" timestamptz,
    "params" jsonb,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "FeaturedResources", hash: 2230ece20cd2013b66f954e5f3ff009a
CREATE TABLE "FeaturedResources" (
    _id varchar(27) PRIMARY KEY,
    "title" text,
    "body" text,
    "ctaText" text,
    "ctaUrl" text,
    "expiresAt" timestamptz,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "GardenCodes", hash: e637bcc1c1b6ae714e8b018876e8807a
CREATE TABLE "GardenCodes" (
    _id varchar(27) PRIMARY KEY,
    "code" text,
    "title" text DEFAULT 'Guest Day Pass',
    "userId" varchar(27),
    "slug" text,
    "startTime" timestamptz,
    "endTime" timestamptz,
    "fbLink" text,
    "type" text DEFAULT 'public',
    "hidden" bool DEFAULT false,
    "deleted" bool DEFAULT false,
    "afOnly" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "contents" jsonb,
    "contents_latest" text,
    "pingbacks" jsonb
);

-- Schema for "Images", hash: d5c0e2cc0076979514fea7b1d77ca57b
CREATE TABLE "Images" (
    _id varchar(27) PRIMARY KEY,
    "originalUrl" text,
    "cdnHostedUrl" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "LWEvents", hash: fdf2137d21d86500e77a28b472073f1d
CREATE TABLE "LWEvents" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "name" text,
    "documentId" text,
    "important" bool,
    "properties" jsonb,
    "intercom" bool,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "LegacyData", hash: afda363542f6bbd9252c72529ffd8de3
CREATE TABLE "LegacyData" (
    _id varchar(27) PRIMARY KEY,
    "objectId" text,
    "collectionName" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Localgroups", hash: 3d42decdac6f555258157e2975318768
CREATE TABLE "Localgroups" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "nameInAnotherLanguage" text,
    "organizerIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "lastActivity" timestamptz,
    "types" text[] DEFAULT '{''LW''}' ::text[],
    "categories" text[],
    "isOnline" bool DEFAULT false,
    "mongoLocation" jsonb,
    "googleLocation" jsonb,
    "location" text,
    "contactInfo" text,
    "facebookLink" text,
    "facebookPageLink" text,
    "meetupLink" text,
    "slackLink" text,
    "website" text,
    "bannerImageId" text,
    "inactive" bool DEFAULT false,
    "deleted" bool DEFAULT false,
    "salesforceId" text,
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Messages", hash: cede968de6400b3df950063c6ecb6202
CREATE TABLE "Messages" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "conversationId" varchar(27),
    "noEmail" bool DEFAULT false,
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Migrations", hash: e8b5fc45d740841c4788a34ec9f623d1
CREATE TABLE "Migrations" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "started" timestamptz,
    "finished" bool DEFAULT false,
    "succeeded" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "ModerationTemplates", hash: 9196d1b41d3f019964f297bec50b3934
CREATE TABLE "ModerationTemplates" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "collectionName" text,
    "order" double precision DEFAULT 0,
    "deleted" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "contents" jsonb,
    "contents_latest" text
);

-- Schema for "ModeratorActions", hash: 5c4cdc5126cd40be46707419b488ba95
CREATE TABLE "ModeratorActions" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "type" text,
    "endedAt" timestamptz,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Notifications", hash: 0cd3c666b29b54d0487b249ee56c2a16
CREATE TABLE "Notifications" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "documentId" text,
    "documentType" text,
    "extraData" jsonb,
    "link" text,
    "title" text,
    "message" text,
    "type" text,
    "deleted" bool DEFAULT false,
    "viewed" bool DEFAULT false,
    "emailed" bool DEFAULT false,
    "waitingForBatch" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "PetrovDayLaunchs", hash: 5b1dee358cd18fda79006cc24eb465b6
CREATE TABLE "PetrovDayLaunchs" (
    _id varchar(27) PRIMARY KEY,
    "launchCode" text,
    "hashedLaunchCode" text,
    "userId" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "PodcastEpisodes", hash: 73707022662f0abded18784c1401cf33
CREATE TABLE "PodcastEpisodes" (
    _id varchar(27) PRIMARY KEY,
    "podcastId" varchar(27),
    "title" text NOT NULL,
    "episodeLink" text NOT NULL,
    "externalEpisodeId" text NOT NULL,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Podcasts", hash: 97180100c8aad811e2f7ad0104a043c0
CREATE TABLE "Podcasts" (
    _id varchar(27) PRIMARY KEY,
    "title" text NOT NULL,
    "applePodcastLink" text,
    "spotifyPodcastLink" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "PostRelations", hash: d45e1248c5fe29f7acd40f3a09ea83d2
CREATE TABLE "PostRelations" (
    _id varchar(27) PRIMARY KEY,
    "type" text,
    "sourcePostId" varchar(27),
    "targetPostId" varchar(27),
    "order" double precision,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Posts", hash: 3af0a7c4d804abbea3f2a8396a737aeb
CREATE TABLE "Posts" (
    _id varchar(27) PRIMARY KEY,
    "postedAt" timestamptz,
    "modifiedAt" timestamptz,
    "url" varchar(500),
    "title" varchar(500) NOT NULL,
    "slug" text,
    "viewCount" double precision DEFAULT 0,
    "lastCommentedAt" timestamptz,
    "clickCount" double precision DEFAULT 0,
    "deletedDraft" bool DEFAULT false,
    "status" double precision,
    "isFuture" bool,
    "sticky" bool DEFAULT false,
    "stickyPriority" integer DEFAULT 2,
    "userIP" text,
    "userAgent" text,
    "referrer" text,
    "author" text,
    "userId" varchar(27),
    "question" bool DEFAULT false,
    "authorIsUnreviewed" bool DEFAULT false,
    "readTimeMinutesOverride" double precision,
    "submitToFrontpage" bool DEFAULT true,
    "hiddenRelatedQuestion" bool DEFAULT false,
    "originalPostRelationSourceId" text,
    "shortform" bool DEFAULT false,
    "canonicalSource" text,
    "nominationCount2018" double precision DEFAULT 0,
    "nominationCount2019" double precision DEFAULT 0,
    "reviewCount2018" double precision DEFAULT 0,
    "reviewCount2019" double precision DEFAULT 0,
    "reviewCount" double precision DEFAULT 0,
    "reviewVoteCount" double precision DEFAULT 0,
    "positiveReviewVoteCount" double precision DEFAULT 0,
    "reviewVoteScoreAF" double precision DEFAULT 0,
    "reviewVotesAF" double precision[] DEFAULT '{}' ::double precision[],
    "reviewVoteScoreHighKarma" double precision DEFAULT 0,
    "reviewVotesHighKarma" double precision[] DEFAULT '{}' ::double precision[],
    "reviewVoteScoreAllKarma" double precision DEFAULT 0,
    "reviewVotesAllKarma" double precision[] DEFAULT '{}' ::double precision[],
    "finalReviewVoteScoreHighKarma" double precision DEFAULT 0,
    "finalReviewVotesHighKarma" double precision[] DEFAULT '{}' ::double precision[],
    "finalReviewVoteScoreAllKarma" double precision DEFAULT 0,
    "finalReviewVotesAllKarma" double precision[] DEFAULT '{}' ::double precision[],
    "finalReviewVoteScoreAF" double precision DEFAULT 0,
    "finalReviewVotesAF" double precision[] DEFAULT '{}' ::double precision[],
    "lastCommentPromotedAt" timestamptz,
    "tagRelevance" jsonb,
    "noIndex" bool DEFAULT false,
    "rsvps" jsonb[],
    "activateRSVPs" bool,
    "nextDayReminderSent" bool DEFAULT false,
    "onlyVisibleToLoggedIn" bool DEFAULT false,
    "onlyVisibleToEstablishedAccounts" bool DEFAULT false,
    "hideFromRecentDiscussions" bool DEFAULT false,
    "votingSystem" text DEFAULT 'twoAxis',
    "podcastEpisodeId" varchar(27),
    "legacy" bool DEFAULT false,
    "legacyId" text,
    "legacySpam" bool DEFAULT false,
    "feedId" varchar(27),
    "feedLink" text,
    "curatedDate" timestamptz,
    "metaDate" timestamptz,
    "suggestForCuratedUserIds" varchar(27)[],
    "frontpageDate" timestamptz,
    "collectionTitle" text,
    "coauthorStatuses" jsonb[],
    "hasCoauthorPermission" bool DEFAULT true,
    "socialPreviewImageId" text,
    "socialPreviewImageAutoUrl" text,
    "fmCrosspost" jsonb DEFAULT '{"isCrosspost":false}' ::jsonb,
    "canonicalSequenceId" varchar(27),
    "canonicalCollectionSlug" text,
    "canonicalBookId" varchar(27),
    "canonicalNextPostSlug" text,
    "canonicalPrevPostSlug" text,
    "unlisted" bool DEFAULT false,
    "disableRecommendation" bool DEFAULT false,
    "defaultRecommendation" bool DEFAULT false,
    "draft" bool DEFAULT false,
    "meta" bool DEFAULT false,
    "hideFrontpageComments" bool DEFAULT false,
    "maxBaseScore" double precision,
    "scoreExceeded2Date" timestamptz,
    "scoreExceeded30Date" timestamptz,
    "scoreExceeded45Date" timestamptz,
    "scoreExceeded75Date" timestamptz,
    "scoreExceeded125Date" timestamptz,
    "scoreExceeded200Date" timestamptz,
    "bannedUserIds" varchar(27)[],
    "commentsLocked" bool,
    "commentsLockedToAccountsCreatedAfter" timestamptz,
    "organizerIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "groupId" varchar(27),
    "eventType" text,
    "isEvent" bool DEFAULT false,
    "reviewedByUserId" varchar(27),
    "reviewForCuratedUserId" varchar(27),
    "startTime" timestamptz,
    "localStartTime" timestamptz,
    "endTime" timestamptz,
    "localEndTime" timestamptz,
    "eventRegistrationLink" text,
    "joinEventLink" text,
    "onlineEvent" bool DEFAULT false,
    "globalEvent" bool DEFAULT false,
    "mongoLocation" jsonb,
    "googleLocation" jsonb,
    "location" text,
    "contactInfo" text,
    "facebookLink" text,
    "meetupLink" text,
    "website" text,
    "eventImageId" text,
    "types" text[],
    "metaSticky" bool DEFAULT false,
    "sharingSettings" jsonb,
    "shareWithUsers" varchar(27)[],
    "linkSharingKey" text,
    "linkSharingKeyUsedBy" varchar(27)[],
    "commentSortOrder" text,
    "hideAuthor" bool DEFAULT false,
    "sideCommentsCache" jsonb,
    "sideCommentVisibility" text,
    "moderationStyle" text,
    "hideCommentKarma" bool DEFAULT false,
    "commentCount" double precision DEFAULT 0,
    "debate" bool DEFAULT false,
    "rejected" bool DEFAULT false,
    "rejectedByUserId" varchar(27),
    "subforumTagId" varchar(27),
    "af" bool DEFAULT false,
    "afDate" timestamptz,
    "afCommentCount" double precision DEFAULT 0,
    "afLastCommentedAt" timestamptz,
    "afSticky" bool DEFAULT false,
    "suggestForAlignmentUserIds" text[] DEFAULT '{}' ::text[],
    "reviewForAlignmentUserId" text,
    "agentFoundationsId" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "contents" jsonb,
    "contents_latest" text,
    "pingbacks" jsonb,
    "moderationGuidelines" jsonb,
    "moderationGuidelines_latest" text,
    "customHighlight" jsonb,
    "customHighlight_latest" text,
    "voteCount" double precision DEFAULT 0,
    "baseScore" double precision DEFAULT 0,
    "extendedScore" jsonb,
    "score" double precision DEFAULT 0,
    "inactive" bool,
    "afBaseScore" double precision,
    "afExtendedScore" jsonb,
    "afVoteCount" double precision
);

-- Schema for "RSSFeeds", hash: fbaf4d1b0aa6fa4f2df3487686aa0a27
CREATE TABLE "RSSFeeds" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "ownedByUser" bool DEFAULT false,
    "displayFullContent" bool DEFAULT false,
    "nickname" text,
    "url" text,
    "status" text,
    "rawFeed" jsonb,
    "setCanonicalUrl" bool DEFAULT false,
    "importAsDraft" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "ReadStatuses", hash: af3a4de4ac16db7c52cf991ccee49c25
CREATE TABLE "ReadStatuses" (
    _id varchar(27) PRIMARY KEY,
    "postId" varchar(27),
    "tagId" varchar(27),
    "userId" varchar(27),
    "isRead" bool,
    "lastUpdated" timestamptz,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Reports", hash: d085c06c4776df3f0bf534c06d930ed0
CREATE TABLE "Reports" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "reportedUserId" varchar(27),
    "commentId" varchar(27),
    "postId" varchar(27),
    "link" text NOT NULL,
    "claimedUserId" varchar(27),
    "description" text,
    "closedAt" timestamptz,
    "markedAsSpam" bool,
    "reportedAsSpam" bool,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "ReviewVotes", hash: 51fa6d67b90a70571a1a79435e28ee70
CREATE TABLE "ReviewVotes" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "postId" varchar(27),
    "qualitativeScore" integer DEFAULT 4,
    "quadraticScore" integer DEFAULT 0,
    "comment" text,
    "year" text DEFAULT '2018',
    "dummy" bool DEFAULT false,
    "reactions" text[],
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Revisions", hash: 90b01b12b0bb3b34831f2d989426785b
CREATE TABLE "Revisions" (
    _id varchar(27) PRIMARY KEY,
    "documentId" text,
    "collectionName" text,
    "fieldName" text,
    "editedAt" timestamptz,
    "autosaveTimeoutStart" timestamptz,
    "updateType" text,
    "version" text,
    "commitMessage" text,
    "userId" varchar(27),
    "draft" bool,
    "originalContents" jsonb,
    "html" text,
    "wordCount" double precision,
    "changeMetrics" jsonb,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "voteCount" double precision DEFAULT 0,
    "baseScore" double precision DEFAULT 0,
    "extendedScore" jsonb,
    "score" double precision DEFAULT 0,
    "inactive" bool,
    "afBaseScore" double precision,
    "afExtendedScore" jsonb,
    "afVoteCount" double precision
);

-- Schema for "Sequences", hash: d43b94c6f11e0f139fa70b19443be4bf
CREATE TABLE "Sequences" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "title" text NOT NULL,
    "gridImageId" text,
    "bannerImageId" text,
    "curatedOrder" double precision,
    "userProfileOrder" double precision,
    "draft" bool DEFAULT false,
    "isDeleted" bool DEFAULT false,
    "canonicalCollectionSlug" text,
    "hidden" bool DEFAULT false,
    "hideFromAuthorPage" bool DEFAULT false,
    "af" bool DEFAULT false,
    "contents" jsonb,
    "contents_latest" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Sessions", hash: bece207584ea30ad0d7f16387a144498
CREATE TABLE "Sessions" (
    _id text NOT NULL PRIMARY KEY,
    "session" jsonb,
    "expires" timestamptz,
    "lastModified" timestamptz
);

-- Schema for "Spotlights", hash: 2665439b064e8c84daaf637c511f11f0
CREATE TABLE "Spotlights" (
    _id varchar(27) PRIMARY KEY,
    "documentId" text,
    "documentType" text DEFAULT 'Sequence',
    "position" double precision,
    "duration" double precision DEFAULT 3,
    "customTitle" text,
    "customSubtitle" text,
    "lastPromotedAt" timestamptz DEFAULT '1970-01-01T00:00:00.000Z',
    "draft" bool DEFAULT true,
    "showAuthor" bool NOT NULL DEFAULT false,
    "spotlightImageId" text,
    "spotlightDarkImageId" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "description" jsonb,
    "description_latest" text
);

-- Schema for "Subscriptions", hash: bace41062c69eb7571091413669d64d5
CREATE TABLE "Subscriptions" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "state" text,
    "documentId" text,
    "collectionName" text,
    "deleted" bool DEFAULT false,
    "type" text,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "TagFlags", hash: 9fe5201647ce899c0b5d875fbf12f690
CREATE TABLE "TagFlags" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "deleted" bool DEFAULT false,
    "slug" text,
    "order" double precision,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "contents" jsonb,
    "contents_latest" text
);

-- Schema for "TagRels", hash: e9888d7a5766bee9edaf3afe7d3f57b8
CREATE TABLE "TagRels" (
    _id varchar(27) PRIMARY KEY,
    "tagId" varchar(27),
    "postId" varchar(27),
    "deleted" bool DEFAULT false,
    "userId" varchar(27),
    "backfilled" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "voteCount" double precision DEFAULT 0,
    "baseScore" double precision DEFAULT 0,
    "extendedScore" jsonb,
    "score" double precision DEFAULT 0,
    "inactive" bool,
    "afBaseScore" double precision,
    "afExtendedScore" jsonb,
    "afVoteCount" double precision
);

-- Schema for "Tags", hash: 66c84c8a02ec236dcf00125ab99cc0ce
CREATE TABLE "Tags" (
    _id varchar(27) PRIMARY KEY,
    "name" text,
    "shortName" text,
    "subtitle" text,
    "slug" text,
    "oldSlugs" text[],
    "core" bool DEFAULT false,
    "suggestedAsFilter" bool DEFAULT false,
    "defaultOrder" double precision DEFAULT 0,
    "descriptionTruncationCount" double precision DEFAULT 0,
    "postCount" double precision DEFAULT 0,
    "userId" varchar(27),
    "adminOnly" bool DEFAULT false,
    "canEditUserIds" varchar(27)[],
    "charsAdded" double precision,
    "charsRemoved" double precision,
    "deleted" bool DEFAULT false,
    "lastCommentedAt" timestamptz,
    "lastSubforumCommentAt" timestamptz,
    "needsReview" bool DEFAULT true,
    "reviewedByUserId" varchar(27),
    "wikiGrade" integer DEFAULT 2,
    "wikiOnly" bool DEFAULT false,
    "bannerImageId" text,
    "squareImageId" text,
    "tagFlagsIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "lesswrongWikiImportRevision" text,
    "lesswrongWikiImportSlug" text,
    "lesswrongWikiImportCompleted" bool,
    "htmlWithContributorAnnotations" text,
    "contributionStats" jsonb,
    "introSequenceId" varchar(27),
    "postsDefaultSortOrder" text,
    "canVoteOnRels" text[],
    "isSubforum" bool DEFAULT false,
    "subforumModeratorIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "subforumIntroPostId" varchar(27),
    "parentTagId" varchar(27),
    "subTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "autoTagModel" text DEFAULT '',
    "autoTagPrompt" text DEFAULT '',
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "description" jsonb,
    "description_latest" text,
    "subforumWelcomeText" jsonb,
    "subforumWelcomeText_latest" text,
    "moderationGuidelines" jsonb,
    "moderationGuidelines_latest" text
);

-- Schema for "UserActivities", hash: 0ab5700d352f6273e9a280dca6d864d5
CREATE TABLE "UserActivities" (
    _id varchar(27) PRIMARY KEY,
    "visitorId" text,
    "type" text,
    "startDate" timestamptz,
    "endDate" timestamptz,
    "activityArray" double precision[],
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "UserMostValuablePosts", hash: 18360b12e30e6c11cf29b03a02112707
CREATE TABLE "UserMostValuablePosts" (
    _id varchar(27) PRIMARY KEY,
    "userId" varchar(27),
    "postId" varchar(27),
    "deleted" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "UserTagRels", hash: 5a3d10302be2b58e21dc7771941b3927
CREATE TABLE "UserTagRels" (
    _id varchar(27) PRIMARY KEY,
    "tagId" varchar(27),
    "userId" varchar(27),
    "subforumLastVisitedAt" timestamptz,
    "subforumShowUnreadInSidebar" bool NOT NULL DEFAULT true,
    "subforumEmailNotifications" bool NOT NULL DEFAULT false,
    "subforumHideIntroPost" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

-- Schema for "Users", hash: 9386b171feef6628a604069fe9619525
CREATE TABLE "Users" (
    _id varchar(27) PRIMARY KEY,
    "username" text,
    "emails" jsonb[],
    "isAdmin" bool,
    "profile" jsonb,
    "services" jsonb,
    "displayName" text,
    "previousDisplayName" text,
    "email" text,
    "slug" text,
    "noindex" bool DEFAULT false,
    "groups" text[],
    "lwWikiImport" bool,
    "theme" jsonb DEFAULT '{"name":"auto"}' ::jsonb,
    "lastUsedTimezone" text,
    "whenConfirmationEmailSent" timestamptz,
    "legacy" bool DEFAULT false,
    "commentSorting" text,
    "sortDraftsBy" text,
    "noKibitz" bool,
    "showHideKarmaOption" bool,
    "showPostAuthorCard" bool,
    "hideIntercom" bool DEFAULT false,
    "markDownPostEditor" bool DEFAULT false,
    "hideElicitPredictions" bool DEFAULT false,
    "hideAFNonMemberInitialWarning" bool DEFAULT false,
    "noSingleLineComments" bool DEFAULT false,
    "noCollapseCommentsPosts" bool DEFAULT false,
    "noCollapseCommentsFrontpage" bool DEFAULT false,
    "hideCommunitySection" bool DEFAULT false,
    "showCommunityInRecentDiscussion" bool DEFAULT false,
    "noComicSans" bool DEFAULT false,
    "petrovOptOut" bool DEFAULT false,
    "acceptedTos" bool DEFAULT false,
    "hideNavigationSidebar" bool,
    "currentFrontpageFilter" text,
    "frontpageFilterSettings" jsonb,
    "hideFrontpageFilterSettingsDesktop" bool,
    "allPostsTimeframe" text,
    "allPostsFilter" text,
    "allPostsSorting" text,
    "allPostsShowLowKarma" bool,
    "allPostsIncludeEvents" bool,
    "allPostsHideCommunity" bool,
    "allPostsOpenSettings" bool,
    "draftsListSorting" text,
    "draftsListShowArchived" bool,
    "draftsListShowShared" bool,
    "lastNotificationsCheck" timestamptz,
    "karma" double precision,
    "goodHeartTokens" double precision,
    "moderationStyle" text,
    "moderatorAssistance" bool,
    "collapseModerationGuidelines" bool,
    "bannedUserIds" varchar(27)[],
    "bannedPersonalUserIds" varchar(27)[],
    "bookmarkedPostsMetadata" jsonb[] DEFAULT '{}' ::jsonb[],
    "hiddenPostsMetadata" jsonb[] DEFAULT '{}' ::jsonb[],
    "legacyId" text,
    "deleted" bool DEFAULT false,
    "voteBanned" bool,
    "nullifyVotes" bool,
    "deleteContent" bool,
    "banned" timestamptz,
    "auto_subscribe_to_my_posts" bool DEFAULT true,
    "auto_subscribe_to_my_comments" bool DEFAULT true,
    "autoSubscribeAsOrganizer" bool DEFAULT true,
    "notificationCommentsOnSubscribedPost" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationShortformContent" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationRepliesToMyComments" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationRepliesToSubscribedComments" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationSubscribedUserPost" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationPostsInGroups" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationSubscribedTagPost" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationPrivateMessage" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationSharedWithMe" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationAlignmentSubmissionApproved" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationEventInRadius" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationRSVPs" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationGroupAdministration" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationCommentsOnDraft" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationPostsNominatedReview" jsonb DEFAULT '{"channel":"both","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationSubforumUnread" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationNewMention" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationDebateCommentsOnSubscribedPost" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"daily","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "notificationDebateReplies" jsonb DEFAULT '{"channel":"onsite","batchingFrequency":"realtime","timeOfDayGMT":12,"dayOfWeekGMT":"Monday"}' ::jsonb,
    "karmaChangeNotifierSettings" jsonb DEFAULT '{"updateFrequency":"daily","timeOfDayGMT":11,"dayOfWeekGMT":"Saturday","showNegativeKarma":false}' ::jsonb,
    "karmaChangeLastOpened" timestamptz,
    "karmaChangeBatchStart" timestamptz,
    "emailSubscribedToCurated" bool,
    "subscribedToDigest" bool DEFAULT false,
    "unsubscribeFromAll" bool,
    "hideSubscribePoke" bool DEFAULT false,
    "hideMeetupsPoke" bool DEFAULT false,
    "frontpagePostCount" double precision DEFAULT 0,
    "sequenceCount" double precision DEFAULT 0,
    "sequenceDraftCount" double precision DEFAULT 0,
    "mongoLocation" jsonb,
    "googleLocation" jsonb,
    "location" text,
    "mapLocation" jsonb,
    "mapLocationSet" bool,
    "mapMarkerText" text,
    "htmlMapMarkerText" text,
    "nearbyEventsNotifications" bool DEFAULT false,
    "nearbyEventsNotificationsLocation" jsonb,
    "nearbyEventsNotificationsMongoLocation" jsonb,
    "nearbyEventsNotificationsRadius" double precision,
    "nearbyPeopleNotificationThreshold" double precision,
    "hideFrontpageMap" bool,
    "hideTaggingProgressBar" bool,
    "hideFrontpageBookAd" bool,
    "hideFrontpageBook2019Ad" bool,
    "sunshineNotes" text DEFAULT '',
    "sunshineFlagged" bool DEFAULT false,
    "needsReview" bool DEFAULT false,
    "sunshineSnoozed" bool DEFAULT false,
    "snoozedUntilContentCount" double precision,
    "reviewedByUserId" varchar(27),
    "reviewedAt" timestamptz,
    "afKarma" double precision DEFAULT 0,
    "voteCount" double precision,
    "smallUpvoteCount" double precision,
    "smallDownvoteCount" double precision,
    "bigUpvoteCount" double precision,
    "bigDownvoteCount" double precision,
    "usersContactedBeforeReview" text[],
    "fullName" text,
    "shortformFeedId" varchar(27),
    "viewUnreviewedComments" bool,
    "partiallyReadSequences" jsonb[],
    "beta" bool,
    "reviewVotesQuadratic" bool,
    "reviewVotesQuadratic2019" bool,
    "reviewVotesQuadratic2020" bool,
    "petrovPressedButtonDate" timestamptz,
    "petrovLaunchCodeDate" timestamptz,
    "defaultToCKEditor" bool,
    "signUpReCaptchaRating" double precision,
    "oldSlugs" text[],
    "noExpandUnreadCommentsReview" bool DEFAULT false,
    "postCount" double precision DEFAULT 0,
    "maxPostCount" double precision DEFAULT 0,
    "commentCount" double precision DEFAULT 0,
    "maxCommentCount" double precision DEFAULT 0,
    "tagRevisionCount" double precision DEFAULT 0,
    "abTestKey" text,
    "abTestOverrides" jsonb,
    "reenableDraftJs" bool,
    "walledGardenInvite" bool,
    "hideWalledGardenUI" bool,
    "walledGardenPortalOnboarded" bool,
    "taggingDashboardCollapsed" bool,
    "usernameUnset" bool DEFAULT false,
    "paymentEmail" text,
    "paymentInfo" text,
    "profileImageId" text,
    "jobTitle" text,
    "organization" text,
    "careerStage" text[],
    "website" text,
    "fmCrosspostUserId" text,
    "linkedinProfileURL" text,
    "facebookProfileURL" text,
    "twitterProfileURL" text,
    "githubProfileURL" text,
    "profileTagIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "organizerOfGroupIds" varchar(27)[] DEFAULT '{}' ::varchar(27)[],
    "programParticipation" text[],
    "postingDisabled" bool,
    "allCommentingDisabled" bool,
    "commentingOnOtherUsersDisabled" bool,
    "conversationsDisabled" bool,
    "acknowledgedNewUserGuidelines" bool,
    "subforumPreferredLayout" text,
    "experiencedIn" text[],
    "interestedIn" text[],
    "allowDatadogSessionReplay" bool DEFAULT false,
    "afPostCount" double precision DEFAULT 0,
    "afCommentCount" double precision DEFAULT 0,
    "afSequenceCount" double precision DEFAULT 0,
    "afSequenceDraftCount" double precision DEFAULT 0,
    "reviewForAlignmentForumUserId" text,
    "afApplicationText" text,
    "afSubmittedApplication" bool,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb,
    "moderationGuidelines" jsonb,
    "moderationGuidelines_latest" text,
    "howOthersCanHelpMe" jsonb,
    "howOthersCanHelpMe_latest" text,
    "howICanHelpOthers" jsonb,
    "howICanHelpOthers_latest" text,
    "biography" jsonb,
    "biography_latest" text,
    "recommendationSettings" jsonb
);

-- Schema for "Votes", hash: e721bea34b434e05b0acf89fe15f166c
CREATE TABLE "Votes" (
    _id varchar(27) PRIMARY KEY,
    "documentId" text,
    "collectionName" text,
    "userId" varchar(27),
    "authorIds" varchar(27)[],
    "voteType" text,
    "extendedVoteType" jsonb,
    "power" double precision,
    "afPower" double precision,
    "cancelled" bool DEFAULT false,
    "isUnvote" bool DEFAULT false,
    "votedAt" timestamptz,
    "documentIsAf" bool DEFAULT false,
    "schemaVersion" double precision DEFAULT 1,
    "createdAt" timestamptz DEFAULT CURRENT_TIMESTAMP,
    "legacyData" jsonb
);

