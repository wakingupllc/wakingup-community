import type { FilterTag } from './filterSettings';
import { getPublicSettings, getPublicSettingsLoaded, registeredSettings } from './settingsCache';

const getNestedProperty = function (obj: AnyBecauseTodo, desc: AnyBecauseTodo) {
  var arr = desc.split('.');
  while(arr.length && (obj = obj[arr.shift()]));
  return obj;
};

export function initializeSetting(settingName: string, settingType: "server" | "public" | "instance")  {
  if (registeredSettings[settingName]) throw Error(`Already initialized a setting with name ${settingName} before.`)
  registeredSettings[settingName] = settingType
}

/* 
  A setting which is stored in the database in the "databasemedata" collection, in a record with the `name` field set to "publicSettings" 
  and the `value` field set to a JSON object with all the settings.

  SETTINGS REGISTERED HERE ARE SENT TO THE CLIENT AND ARE NOT PRIVATE. DO NOT USE PUBLIC SETTINGS TO STORE SECRETS. TO STORE SECRETS, USE
  `DatabaseServerSetting`, documented in `databaseSettings.ts`.
  
  For documentation on public instance settings, which are also sent to the client but can be customized per instance, see `instanceSettings.ts`
  
  arguments: 
    settingName: JSON path to the setting in the settings.json file
    defaultValue: What value <Setting>.get() returns when no value is found in the JSON file

  Method: 
    get: Returns the current value of the setting (either the value in the database or the default value)
*/
export class DatabasePublicSetting<SettingValueType> {
  constructor(
    private settingName: string, 
    private defaultValue: SettingValueType
  ) {
    // Affords for a more convenient lazy usage, 
    // so you can refer to setting getter as `setting.get` vs having to wrap it in a function like `() => setting.get()`
    this.get = this.get.bind(this)
    this.getOrThrow = this.getOrThrow.bind(this)
    
    initializeSetting(settingName, "public")
  }
  get(): SettingValueType {
    // eslint-disable-next-line no-console
    if (!getPublicSettingsLoaded()) throw Error(`Tried to access public setting ${this.settingName} before it was initialized`)
    const cacheValue = getNestedProperty(getPublicSettings(), this.settingName)
    if (typeof cacheValue === 'undefined') return this.defaultValue
    return cacheValue
  }
  
  getOrThrow(): SettingValueType {
    const value = this.get()
    if (value === null || value === undefined) throw Error(`Tried to access public setting ${this.settingName} but it was not set`)
    return value
  }
}

/*
  Public Database Settings
*/

export const googleTagManagerIdSetting = new DatabasePublicSetting<string | null>('googleTagManager.apiKey', null) // Google Tag Manager ID
export const reCaptchaSiteKeySetting = new DatabasePublicSetting<string | null>('reCaptcha.apiKey', null) // ReCaptcha API Key

// Despite the name, this setting is also used to set the index prefix for Elasticsearch for legacy reasons
export const algoliaPrefixSetting = new DatabasePublicSetting<string>('algolia.indexPrefix', '')

export const ckEditorUploadUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.uploadUrl', null) // Image Upload URL for CKEditor
export const ckEditorWebsocketUrlSetting = new DatabasePublicSetting<string | null>('ckEditor.webSocketUrl', null) // Websocket URL for CKEditor (for collaboration)


export const hideUnreviewedAuthorCommentsSettings = new DatabasePublicSetting<string | null>('hideUnreviewedAuthorComments', null) // Hide comments by unreviewed authors after date provided (prevents spam / flaming / makes moderation easier, but delays new user engagement)
export const cloudinaryCloudNameSetting = new DatabasePublicSetting<string>('cloudinary.cloudName', 'lesswrong-2-0') // Cloud name for cloudinary hosting

export const forumAllPostsNumDaysSetting = new DatabasePublicSetting<number>('forum.numberOfDays', 10) // Number of days to display in the timeframe view

export const nofollowKarmaThreshold = new DatabasePublicSetting<number>('nofollowKarmaThreshold', 10) // Users with less than this much karma have their links marked as nofollow

export const localeSetting = new DatabasePublicSetting<string>('locale', 'en-US')
export const legacyRouteAcronymSetting = new DatabasePublicSetting<string>('legacyRouteAcronym', 'lw') // Because the EA Forum was identical except for the change from /lw/ to /ea/

// frontpageFilterSettings default tag filter
//
// At the risk of premature future-proofing, this setting, which is initially
// here to allow the EA Forum to nudge down the visibility of posts with the
// Community tag, can be trivially applied to personalBlog, frontpage, and
// curated, if those ever get refactored into tags.
export const defaultVisibilityTags = new DatabasePublicSetting<Array<FilterTag>>('defaultVisibilityTags', [])

export const gatherTownRoomId = new DatabasePublicSetting<string | null>("gatherTownRoomId", "aPVfK3G76UukgiHx")
export const gatherTownRoomName = new DatabasePublicSetting<string | null>("gatherTownRoomName", "lesswrong-campus")

// Public elicit settings
export const elicitSourceURL = new DatabasePublicSetting('elicitSourceURL', 'https://LessWrong.com')
export const elicitSourceId = new DatabasePublicSetting('elicitSourceId', 'XCjOpumu-')

export const mapboxAPIKeySetting = new DatabasePublicSetting<string | null>('mapbox.apiKey', null) // API Key for the mapbox map and tile requests

export const mailchimpForumDigestListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.forumDigestListId', null)
export const mailchimpEAForumListIdSetting = new DatabasePublicSetting<string | null>('mailchimp.eaForumListId', null)

export const sendgridDigestListIdSetting = new DatabasePublicSetting<string | null>('sendgrid.digestListId', null)
export const sendgridWelcomeListIdSetting = new DatabasePublicSetting<string | null>('sendgrid.welcomeListId', null)

export const isProductionDBSetting = new DatabasePublicSetting<boolean>('isProductionDB', false)

export const showReviewOnFrontPageIfActive = new DatabasePublicSetting<boolean>('annualReview.showReviewOnFrontPageIfActive', true)
export const annualReviewStart = new DatabasePublicSetting('annualReview.start', "2021-11-30")
// The following dates cut off their phase at the end of the day
export const annualReviewNominationPhaseEnd = new DatabasePublicSetting('annualReview.nominationPhaseEnd', "2021-12-14")
export const annualReviewReviewPhaseEnd = new DatabasePublicSetting('annualReview.reviewPhaseEnd', "2022-01-15")
export const annualReviewVotingPhaseEnd = new DatabasePublicSetting('annualReview.votingPhaseEnd', "2022-02-01")
export const annualReviewEnd = new DatabasePublicSetting('annualReview.end', "2022-02-06")
export const annualReviewAnnouncementPostPathSetting = new DatabasePublicSetting<string | null>('annualReview.announcementPostPath', null)

export const annualReviewVotingResultsPostPath = new DatabasePublicSetting<string>('annualReview.votingResultsPostPath', "")

export const moderationEmail = new DatabasePublicSetting<string>('moderationEmail', "ERROR: NO MODERATION EMAIL SET")
type AccountInfo = {
  username: string,
  email: string,
};
export const adminAccountSetting = new DatabasePublicSetting<AccountInfo|null>('adminAccount', null);

export const crosspostKarmaThreshold = new DatabasePublicSetting<number | null>('crosspostKarmaThreshold', 100);

export const ddTracingSampleRate = new DatabasePublicSetting<number>('datadog.tracingSampleRate', 100) // Sample rate for backend traces, between 0 and 100
export const ddRumSampleRate = new DatabasePublicSetting<number>('datadog.rumSampleRate', 100) // Sample rate for backend traces, between 0 and 100
export const ddSessionReplaySampleRate = new DatabasePublicSetting<number>('datadog.sessionReplaySampleRate', 100) // Sample rate for backend traces, between 0 and 100

/** Will we show our logo prominently, such as in the header */
export const hasProminentLogoSetting = new DatabasePublicSetting<boolean>("hasProminentLogo", false);

export const showTableOfContentsSetting = new DatabasePublicSetting<boolean>('showTableOfContents', true);
export const showReadingTimeSetting = new DatabasePublicSetting<boolean>('showReadingTime', true);
export const showAudioNodeSetting = new DatabasePublicSetting<boolean>('showAudioNode', true);
export const showSocialMediaShareLinksSetting = new DatabasePublicSetting<boolean>('showSocialMediaShareLinks', true);

export const hasCookieConsentSetting = new DatabasePublicSetting<boolean>('hasCookieConsent', false);
export const frontpagePostsCountSetting = new DatabasePublicSetting<number | null>('frontpagePostsCount', null)
export const frontpagePostsLoadMoreCountSetting = new DatabasePublicSetting<number | undefined>('frontpagePostsLoadMoreCount', undefined)
export const showPersonalBlogpostIconSetting = new DatabasePublicSetting<boolean>('showPersonalBlogpostIcon', true);
export const showFirstPostReviewMessageSetting = new DatabasePublicSetting<boolean>('showFirstPostReviewMessage', true);
export const mentionKarmaThresholdSetting = new DatabasePublicSetting<number | null>('mentionKarmaThreshold', 1); // can be null, in which case there's no threshold
export const showKarmaSetting = new DatabasePublicSetting<boolean>('showKarma', true);
export const requireMarkdownOnMobileSetting = new DatabasePublicSetting<boolean>('requireMarkdownOnMobile', false);
export const wuDefaultProfileImageCloudinaryIdSetting = new DatabasePublicSetting<string>('wuDefaultProfileImageCloudinaryId', "default_profile_image_thumb_x1_ajlf63");
export const onetrustDomainScriptSetting = new DatabasePublicSetting<string>('onetrustDomainScript', "c8afa025-de60-4850-a9db-4962e99aa987-test");
export const devLoginsAllowedSetting = new DatabasePublicSetting<boolean>('devLoginsAllowed', false);
export const devWakingUpCodeSetting = new DatabasePublicSetting<string | null>('dev.wakingUpCode', null);
export const notificationBatchHourInUserTzSetting = new DatabasePublicSetting<number>('notificationBatchHourInUserTz', 17)
export const showVersionHistorySetting = new DatabasePublicSetting<boolean>('showVersionHistory', true);
export const sendAutoMessageOnCommentRemovalSetting = new DatabasePublicSetting<boolean>('sendAutoMessageOnCommentRemoval', true);
export const commentPermalinksAtTopSetting = new DatabasePublicSetting<boolean>('commentPermalinksAtTop', true);
export const showNewUserIconSetting = new DatabasePublicSetting<boolean>('showNewUserIcon', true);
export const sidebarLinksSetting = new DatabasePublicSetting<Array<{id: string, title: string, link: string, subItem: boolean}>>('sidebarLinks', []);
export const onSiteLinkSignifierSetting = new DatabasePublicSetting<string>('onSiteLinkSignifier', '"°"');
export const showLivePreviewsSetting = new DatabasePublicSetting<boolean>('showLivePreviews', true);
export const showCommentRenderExpandOptionsSetting = new DatabasePublicSetting<boolean>('showCommentRenderExpandOptions', true);
export const showPinnedPostPreviewOnHomepageSetting = new DatabasePublicSetting<boolean>('showPinnedPostPreviewOnHomepage', false);

export const dialogueMatchmakingEnabled = new DatabasePublicSetting<boolean>('dialogueMatchmakingEnabled', false)

export const maxRenderQueueSize = new DatabasePublicSetting<number>('maxRenderQueueSize', 10);

export const showSuggestionToCommentIfNoCommentsSetting = new DatabasePublicSetting<boolean>('post.showSuggestionToCommentIfNoComments', true);
export const postCommentCountTruncateThresholdSetting = new DatabasePublicSetting<number>('post.commentCountTruncateThreshold', 70);
export const showConversationOptionsSetting = new DatabasePublicSetting<boolean>('conversation.showOptions', true);
export const defaultCommentOrderSetting = new DatabasePublicSetting<string>('post.defaultCommentOrder', 'postCommentsTop');
// Null means requests are disabled
export const requestFeedbackKarmaLevelSetting = new DatabasePublicSetting<number | null>('post.requestFeedbackKarmaLevel', 100);
export const deletedUsernameSetting = new DatabasePublicSetting<string>('deletedUsername', '[anonymous]');
