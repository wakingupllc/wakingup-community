import React, { useCallback, useState } from "react";
import { Components, getSiteUrl, registerComponent } from "../../../lib/vulcan-lib";
import { useSingle } from "../../../lib/crud/withSingle";
import { AnalyticsContext, useTracking } from "../../../lib/analyticsEvents";
import { Link } from "../../../lib/reactRouterWrapper";
import { SECTION_WIDTH } from "../../common/SingleColumnSection";
import { formatStat } from "../../users/EAUserTooltipContent";
import {
  useAmountRaised,
  useDonationOpportunities,
} from "./hooks";
import {
  donationElectionFundraiserLink,
  donationElectionLink,
  donationElectionTagId,
  eaGivingSeason23ElectionName,
  effectiveGivingTagId,
  heroImageId,
  postsAboutElectionLink,
  setupFundraiserLink,
  timelineSpec,
} from "../../../lib/eaGivingSeason";
import { DiscussIcon, DonateIcon, VoteIcon } from "../../icons/givingSeasonIcons";
import classNames from "classnames";
import { useMessages } from "../../common/withMessages";
import { useUpdateCurrentUser } from "../../hooks/useUpdateCurrentUser";
import { useCurrentUser } from "../../common/withUser";
import { useDialog } from "../../common/withDialog";
import { CloudinaryPropsType, makeCloudinaryImageUrl } from "../../common/CloudinaryImage2";

const styles = (theme: ThemeType) => ({
  root: {
    fontFamily: theme.palette.fonts.sansSerifStack,
    color: theme.palette.grey[1000],
    backgroundColor: theme.palette.givingPortal[0],
    width: "100vw",
    overflow: "hidden",
  },
  sectionLight: {
    backgroundColor: theme.palette.givingPortal[200],
  },
  sectionDark: {
    backgroundColor: theme.palette.givingPortal[800],
    color: theme.palette.grey[0],
  },
  sectionSplit: {
    background: `linear-gradient(
      to top,
      ${theme.palette.givingPortal[800]} 100px,
      ${theme.palette.givingPortal[200]} 100px
    )`,
  },
  content: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    maxWidth: 1252,
    padding: 40,
    margin: "0 auto",
    [theme.breakpoints.down("md")]: {
      padding: 24,
    },
  },
  row: {
    display: "flex",
    gap: "20px",
    "@media screen and (max-width: 1000px)": {
      flexDirection: "column",
      alignItems: "center",
    },
  },
  rowThin: {
    display: "flex",
    gap: "20px",
    alignItems: "center",
    "@media screen and (max-width: 600px)": {
      flexDirection: "column",
    },
  },
  column: {
    display: "flex",
    flexDirection: "column",
    gap: "20px",
    margin: "0 auto",
    maxWidth: "100%",
  },
  bold: {
    fontWeight: "bold",
  },
  center: {
    textAlign: "center",
    alignSelf: "center",
  },
  primaryText: {
    color: theme.palette.givingPortal[1000],
  },
  h1: {
    fontSize: 60,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-1.2px",
    [theme.breakpoints.down("xs")]: {
      fontSize: 40,
    }
  },
  h2: {
    fontSize: 28,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.28px",
  },
  h3: {
    fontSize: 24,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.24px",
  },
  h4: {
    fontSize: 20,
    fontWeight: 700,
    lineHeight: "normal",
    letterSpacing: "-0.2px",
  },
  text: {
    maxWidth: 600,
    fontSize: 16,
    fontWeight: 500,
    lineHeight: "150%",
    "& a": {
      color: "inherit",
      textDecoration: "underline",
      "&:hover": {
        opacity: 1,
        textDecoration: "none",
      },
    },
  },
  textWide: {
    maxWidth: 780,
  },
  underlinedLink: {
    color: "inherit",
    textDecoration: "underline",
    "&:hover": {
      opacity: 1,
      textDecoration: "none",
    },
  },
  buttonDisabled: {
    display: "flex",
    alignItems: "center",
    gap: "10px",
    textAlign: "center",
    fontSize: 16,
    fontWeight: 600,
    background: theme.palette.givingPortal.button.dark,
    color: theme.palette.givingPortal.button.light,
    borderRadius: theme.borderRadius.small,
    padding: "12px 48px",
    border: "none",
    outline: "none",
    userSelect: "none",
    cursor: "not-allowed",
    opacity: 0.65,
  },
  tooltip: {
    background: theme.palette.panelBackground.tooltipBackground2,
    maxWidth: 300,
    textAlign: "center",
  },
  progressBar: {
    position: "relative",
    width: "100%",
    height: 12,
    backgroundColor: theme.palette.givingPortal[800],
    borderRadius: theme.borderRadius.small,
    marginBottom: 16,
    overflow: "hidden",
  },
  progress: {
    position: "absolute",
    left: 0,
    top: 0,
    backgroundColor: theme.palette.givingPortal[1000],
    height: "100%",
  },
  raisedSoFar: {
    fontWeight: 700,
    fontSize: 20,
    letterSpacing: "-0.2px",
    color: theme.palette.grey[1000],
  },
  postsList: {
    width: SECTION_WIDTH,
    maxWidth: "100%",
    "& .LoadMore-root": {
      color: theme.palette.grey[600],
    },
  },
  primaryLoadMore: {
    "& .LoadMore-root": {
      color: theme.palette.givingPortal[1000],
    },
  },
  electionCandidates: {
    width: 1120,
    maxWidth: "100%",
  },
  grid: {
    width: "100%",
    display: "flex",
    flexWrap: "wrap",
    gap: "16px",
    rowGap: "16px",
  },
  totalRaised: {
    fontSize: 24,
    fontWeight: 700,
    letterSpacing: "-0.24px",
    lineHeight: "140%",
    paddingLeft: 4,
  },
  loadMore: {
    color: theme.palette.givingPortal[1000],
    fontSize: 16,
    fontWeight: 700,
    letterSpacing: "-0.16px",
    cursor: "pointer",
    "&:hover": {
      opacity: 0.8,
    },
  },
  sequence: {
    maxWidth: 264,
  },
  hideOnMobile: {
    [theme.breakpoints.down("sm")]: {
      display: "none",
    },
  },
  mt10: { marginTop: 10 },
  mt20: { marginTop: 20 },
  mt30: { marginTop: 30 },
  mt60: { marginTop: 60 },
  mt80: { marginTop: 80 },
  mb20: { marginBottom: 20 },
  mb40: { marginBottom: 40 },
  mb80: { marginBottom: 80 },
  mb100: { marginBottom: 100 },
  w100: { width: "100%" },
});

const getListTerms = ({ tagId, sortedBy, limit, after }: {
  tagId: string,
  sortedBy: PostSortingModeWithRelevanceOption,
  limit: number,
  after?: string,
}): PostsViewTerms => ({
  filterSettings: {
    tags: [
      {
        tagId,
        filterMode: "Required",
      },
    ],
  },
  after,
  sortedBy,
  limit,
  // Make it more recency biased, this is how these numbers translate to the time decay factor:
  // Higher timeDecayFactor => more recency bias
  // const timeDecayFactor = Math.min(
  //   decayFactorSlowest * (1 + (activityWeight * activityFactor)),
  //   decayFactorFastest
  // );
  algoActivityFactor: 1.0,
  algoActivityWeight: 3.0,
  algoDecayFactorFastest: 3.0,
});

/** Format as dollars with no cents */
const formatDollars = (amount: number) => "$" + formatStat(Math.round(amount));

const canonicalUrl = getSiteUrl() + "giving-portal";

const pageDescription = "It's Giving season on the EA Forum. We're hosting a Donation Election, weekly themes, and more throughout November and December 2023.";

const socialImageProps: CloudinaryPropsType = {
  dpr: "auto",
  ar: "16:9",
  w: "1200",
  c: "fill",
  g: "center",
  q: "auto",
  f: "auto",
};

const EAGivingPortalPage = ({classes}: {classes: ClassesType<typeof styles>}) => {
  const { data: amountRaised, loading: amountRaisedLoading } = useAmountRaised(eaGivingSeason23ElectionName);

  const {
    results: donationOpportunities,
    loading: donationOpportunitiesLoading,
    loadMoreProps: donationOpportunitiesLoadMoreProps,
  } = useDonationOpportunities();
  const {document: donationElectionTag} = useSingle({
    documentId: donationElectionTagId,
    collectionName: "Tags",
    fragmentName: "TagBasicInfo",
  });
  /*
  const {
    results: relevantSequences,
    loading: loadingRelevantSequences,
  } = useMulti({
    collectionName: "Sequences",
    fragmentName: "SequencesPageFragment",
    terms: {sequenceIds: [
      "wog9xb8cdqDySbBvM", // TODO: Add more sequences here
    ]},
  });
   */
  const currentUser = useCurrentUser();
  const updateCurrentUser = useUpdateCurrentUser();
  const [notifyForVotingOn, setNotifyForVotingOn] = useState(currentUser?.givingSeasonNotifyForVoting ?? false);
  const {flash} = useMessages();
  const {openDialog} = useDialog();
  const { captureEvent } = useTracking({ eventProps: { pageContext: "eaGivingPortal" } });

  const toggleNotifyWhenVotingOpens = useCallback(() => {
    captureEvent('toggleNotifyWhenVotingOpens', { notifyForVotingOn: !notifyForVotingOn })

    if (!currentUser) {
      openDialog({
        componentName: "LoginPopup",
        componentProps: {},
      })
      return;
    }
    setNotifyForVotingOn(!notifyForVotingOn);
    void updateCurrentUser({givingSeasonNotifyForVoting: !notifyForVotingOn});
    flash(`Notifications ${notifyForVotingOn ? "disabled" : "enabled"}`);
  }, [captureEvent, notifyForVotingOn, currentUser, updateCurrentUser, flash, openDialog]);

  const donationElectionPostsTerms = getListTerms({
    tagId: donationElectionTagId,
    sortedBy: "magic",
    limit: 8,
  });

  const totalRaisedFormatted = formatDollars(amountRaised.totalRaised);
  const raisedForElectionFundFormatted = formatDollars(amountRaised.raisedForElectionFund);
  const targetPercent = amountRaised.electionFundTarget > 0 ? (amountRaised.raisedForElectionFund / amountRaised.electionFundTarget) * 100 : 0;

  const {
    Loading, LoadMore, HeadTags, Timeline, ElectionFundCTA, ForumIcon, PostsList2,
    ElectionCandidatesList, DonationOpportunity, CloudinaryImage2, QuickTakesList,
    LWTooltip,
  } = Components;
  return (
    <AnalyticsContext pageContext="eaGivingPortal">
      <div className={classes.root}>
        <HeadTags
          title="Giving portal"
          canonicalUrl={canonicalUrl}
          ogUrl={canonicalUrl}
          description={pageDescription}
          image={makeCloudinaryImageUrl(heroImageId, socialImageProps)}
        />
        <div className={classNames(classes.content, classes.mb20)} id="top">
          <div className={classNames(classes.h1, classes.center, classes.mt30)}>
            Giving portal
          </div>
          <div className={classNames(classes.text, classes.center)}>
            {pageDescription}
          </div>
          <div className={classNames(
            classes.h2,
            classes.mt20,
            classes.hideOnMobile,
          )}>
            Timeline
          </div>
          <Timeline {...timelineSpec} className={classes.hideOnMobile} />
        </div>
        <div className={classes.sectionSplit}>
          <div className={classes.content} id="election">
            <div className={classNames(classes.column, classes.mt60)}>
              <div className={classNames(classes.h1, classes.primaryText)}>
                Donation election 2023
              </div>
              <div className={classNames(
                classes.text,
                classes.primaryText,
                classes.textWide,
                classes.mb20,
              )}>
                <span className={classes.bold}>
                Contribute to the Donation Election Fund to encourage more discussion about donation choice and effective giving.
                </span>{" "}
                The fund will be designated for the top 3 winners in the Donation Election.{" "}
                <Link to={donationElectionLink}>Learn more</Link>.
              </div>
              <div className={classNames(classes.row, classes.mt20)}>
                <ElectionFundCTA
                  image={<DonateIcon />}
                  title="Donate"
                  description="The fund will be designated for the top 3 candidates, based on Forum users' votes."
                  buttonText="Donate"
                  href={donationElectionFundraiserLink}
                  solidButton
                >
                  {!amountRaisedLoading &&
                    <>
                      <div className={classes.progressBar}>
                        <div
                          className={classes.progress}
                          style={{width: `${targetPercent}%`}}
                        />
                      </div>
                      <div className={classes.raisedSoFar}>
                        {raisedForElectionFundFormatted} raised so far
                      </div>
                    </>
                  }
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<DiscussIcon />}
                  title="Discuss"
                  description="Discuss where we should donate and what we should vote for in the Election."
                  buttonText="Contribute to the discussion"
                  href="/posts/hAzhyikPnLnMXweXG/participate-in-the-donation-election-and-the-first-weekly#Start_discussing_where_we_should_donate__what_we_should_vote_for__and_other_questions_related_to_effective_giving"
                >
                  <Link
                    to={postsAboutElectionLink}
                    className={classes.underlinedLink}
                    eventProps={{pageElementContext: "givingPortalViewRelatedPosts"}}
                  >
                    View {donationElectionTag?.postCount} related post{donationElectionTag?.postCount === 1 ? "" : "s"}
                  </Link>
                </ElectionFundCTA>
                <ElectionFundCTA
                  image={<VoteIcon />}
                  title="Vote"
                  description="Voting opens December 1. You can already pre-vote below to show which candidates you’re likely to vote for."
                  buttonText={notifyForVotingOn ? "You'll be notified when voting opens" : "Get notified when voting opens"}
                  buttonIcon={notifyForVotingOn ? undefined : "BellAlert"}
                  onButtonClick={toggleNotifyWhenVotingOpens}
                />
              </div>
            </div>
          </div>
        </div>
        <div className={classes.sectionDark}>
          <div className={classes.content} id="candidates">
            <div className={classes.column}>
              <div className={classNames(classes.h2, classes.primaryText)}>
                Candidates in the Election
              </div>
              <div className={classNames(
                classes.text,
                classes.primaryText,
                classes.textWide,
                classes.mb20,
              )}>
                The Donation Election Fund will be designated for the top three winning candidates in the election (split proportionately, based on users' votes). Voting will open on 1 December, 2023.
                <ul>
                  <li><b>Pre-vote</b> to show which candidates you're likely to vote for. Pre-votes are anonymous, don't turn into real votes, and you can change them at any time.</li>
                  <li><b>Add candidates</b> if you think they should be in the Election. Any project <a href="https://docs.google.com/spreadsheets/d/1I-IFdkai9frIIMO6fVqOIp6PDllXG713UhnI1WuwyiQ/edit#gid=0">
                  here</a> can be a candidate.</li>
                </ul>
                <i>Only users who had an account as of 22 October 2023 can pre-vote or vote in the election.</i>
              </div>
              <ElectionCandidatesList className={classes.electionCandidates} />
              <div className={classNames(
                classes.rowThin,
                classes.mt10,
                classes.mb80,
              )}>
                <LWTooltip
                  title="The deadline for adding candidates has now passed"
                  placement="right"
                  popperClassName={classes.tooltip}
                  className={classes.buttonDisabled}
                >
                  <ForumIcon icon="Plus" />
                  Add candidate
                </LWTooltip>
              </div>
            </div>
          </div>
        </div>
        <CloudinaryImage2 publicId={heroImageId} fullWidthHeader imgProps={{ h: "1200" }} />
        <div className={classes.sectionLight}>
          <div className={classes.content}>
            <div className={classNames(
              classes.column,
              classes.mt60,
              classes.mb80,
            )} id="posts">
              <div className={classNames(classes.h2, classes.primaryText)}>
                Posts tagged &quot;Donation Election 2023&quot;
              </div>
              <div className={classNames(
                classes.postsList,
                classes.primaryLoadMore,
              )}>
                <PostsList2
                  terms={donationElectionPostsTerms}
                  loadMoreMessage="View more"
                />
              </div>
              <div className={classNames(
                classes.h2,
                classes.primaryText,
                classes.mt30,
              )}>
                Quick takes tagged &quot;Effective Giving&quot;
              </div>
              <QuickTakesList
                showCommunity
                tagId={effectiveGivingTagId}
                maxAgeDays={30}
                className={classNames(classes.postsList, classes.primaryLoadMore)}
              />
            </div>
          </div>
        </div>
        <div className={classNames(
          classes.content,
          classes.mt60,
          classes.mb80,
        )} id="opportunities">
          <div className={classes.h1}>Other donation opportunities</div>
          <div className={classNames(classes.text, classes.textWide)}>
          Supporting high-impact work via donations is a core part of effective altruism. You can donate to featured projects below,{" "}
            <a href={setupFundraiserLink}>run custom fundraisers</a>, or <a href="https://www.givingwhatwecan.org">more</a>.
          </div>
          {!amountRaisedLoading &&
            <div className={classes.text}>
              Total donations raised through the Forum:{" "}
              <span className={classes.totalRaised}>{totalRaisedFormatted}</span>
            </div>
          }
          <div className={classNames(classes.grid, classes.mt10)}>
            {donationOpportunities?.map((candidate) => (
              <DonationOpportunity candidate={candidate} key={candidate._id} />
            ))}
            {donationOpportunitiesLoading && <Loading />}
          </div>
          <LoadMore className={classes.loadMore} {...donationOpportunitiesLoadMoreProps} />
        </div>
        {/* TODO add in these sequences once more of them exist */}
        {/* <div className={classNames(classes.content, classes.mb100)}>
          <div className={classNames(classes.column, classes.w100)}>
            <div className={classes.h2}>
              Featured reading on Giving season
            </div>
            <div className={classes.grid}>
              {relevantSequences?.map((sequence) => (
                <EASequenceCard
                  key={sequence._id}
                  sequence={sequence}
                  className={classes.sequence}
                />
              ))}
            </div>
            {loadingRelevantSequences && <Loading />}
          </div>
        </div> */}
      </div>
    </AnalyticsContext>
  );
}

const EAGivingPortalPageComponent = registerComponent(
  "EAGivingPortalPage",
  EAGivingPortalPage,
  {styles},
);

declare global {
  interface ComponentTypes {
    EAGivingPortalPage: typeof EAGivingPortalPageComponent;
  }
}
