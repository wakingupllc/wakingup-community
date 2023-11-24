import { Components, registerComponent, getFragment } from '../../lib/vulcan-lib';
import { useMessages } from '../common/withMessages';
import React from 'react';
import { getUserEmail, isLoginLocked, loginLockedUntil, userCanEditUser, userGetProfileUrl} from '../../lib/collections/users/helpers';
import Button from '@material-ui/core/Button';
import { useCurrentUser } from '../common/withUser';
import { useNavigation } from '../../lib/routeUtil';
import { gql, useMutation, useApolloClient } from '@apollo/client';
import { useThemeOptions, useSetTheme } from '../themes/useTheme';
import { captureEvent } from '../../lib/analyticsEvents';
import { configureDatadogRum } from '../../client/datadogRum';
import { preferredHeadingCase } from '../../lib/forumTypeUtils';
import {textFieldContainerStyles} from '../form-components/MuiTextField.tsx'
import { useSingle } from '../../lib/crud/withSingle.ts';

// TODO: would be great to have this part of the theme 🤔
const smallLabelFont = 12
const styles = (theme: ThemeType): JssStyles => ({
  root: {
    width: "60%",
    maxWidth: 600,
    margin: "auto",
    marginBottom: 100,
    [theme.breakpoints.down('xs')]: {
      width: "100%",
    },
    "--ck-color-engine-placeholder-text": theme.palette.grey[340],
    
    "& .form-input": {
      ...textFieldContainerStyles(theme),
    },

    "& .form-section-unicode": {
      padding: 0,
    },
    
    "& .form-submit": {
      marginTop: "3em",
      textAlign: "right",
      
      "& button": {
        paddingLeft: "3em",
        paddingRight: "3em",
      },
    },
    "& .FieldErrors-root": {
      // Remove inline error messages for fields 
      display: 'none',
    },
    "& .input-first_name, & .input-last_name": {
      display: 'inline-block',
      width: '49%',
      marginBottom: "0",
      [theme.breakpoints.down('sm')]: {
        display: 'block',
        width: "100%",
        margin: "16px 0",
      },
    },

    "& .input-last_name": {
      float: "right",
      [theme.breakpoints.down('sm')]: {
        float: "none",
      },
    },
    
    "& .EditorFormComponent-label" : {
      fontSize: smallLabelFont,
      color: theme.palette.grey[340],
    },
    
    "& .ck.ck-content": {
      fontWeight: 600,
    }, 
  },

  header: {
    margin: theme.spacing.unit * 2,
    marginBottom: theme.spacing.unit * 4,
    marginLeft: 0,
  },
  resetButton: {
    marginBottom:theme.spacing.unit * 4
  },
  smallLabel: {
    ...theme.typography.smallText,
    fontSize: smallLabelFont,
  },
  userName: {
    fontWeight: 600,
  },
  nonEditableUserInfo: {
    display: "flex",
    columnGap: "2.5%",
    flexWrap: "wrap",
  },
  nonEditableUserInfoItem: {
    flexGrow: 1,
    flexBasis: "48%",
    marginBottom: "0.5em",
  },
  loginLockInfoItem: {
    flexGrow: 1,
    flexBasis: "48%",
    marginBottom: "0.5em",
    marginTop: "1em",
    color: theme.palette.text.warning,
  },
  loginLockItem: {
    fontWeight: 600,
    color: theme.palette.text.warning,
  },
  unlockButton: {
    marginBottom:theme.spacing.unit * 4,
    color: theme.palette.text.warning,
    borderColor: theme.palette.text.warning,
  },
})

const passwordResetMutation = gql`
  mutation resetPassword($email: String) {
    resetPassword(email: $email)
  }
`

const unlockMutation = gql`
  mutation unlockLogin($userSlug: String) {
    unlockLogin(userSlug: $userSlug)
  }
`

const UsersEditForm = ({terms, classes, enableResetPassword = false}: {
  terms: {slug?: string, documentId?: string},
  enableResetPassword?: boolean,
  classes: ClassesType,
}) => {
  const currentUser = useCurrentUser();
  const { flash } = useMessages();
  const { history } = useNavigation();
  const client = useApolloClient();
  const { Typography } = Components;
  const [ mutate, loading ] = useMutation(passwordResetMutation, { errorPolicy: 'all' })
  const [ mutateUnlock ] = useMutation(unlockMutation, { errorPolicy: 'all' })
  const currentThemeOptions = useThemeOptions();
  const setTheme = useSetTheme();

  // loadedUser is the account settings user, usually yourself, but admins can edit other users.
  // Because of the skip parameter, this query is only run if the user is an admin.
  // Regrettably, the WrappedSmartForm will also load this user, but we can't get the user
  // value back out of the form, so we have to load it here as well.
  const loadedUser = useSingle({
    slug: terms.slug,
    collectionName: "Users",
    fragmentName: "UsersAdmin",
    fetchPolicy: "no-cache",
    skip: !currentUser?.isAdmin,
  })?.document;

  const user = loadedUser || currentUser;

  if(!terms.slug && !terms.documentId) {
    // No user specified and not logged in
    return (
      <div className={classes.root}>
        Log in to edit your profile.
      </div>
    );
  }
  if (!userCanEditUser(currentUser,
    terms.documentId ?
      {_id: terms.documentId} :
      // HasSlugType wants some fields we don't have (schemaVersion, _id), but
      // userCanEdit won't use them
      {slug: terms.slug, __collectionName: 'Users'} as HasSlugType
  )) {
    return <span>Sorry, you do not have permission to do this at this time.</span>
  }

  // currentUser will not be the user being edited in the case where current
  // user is an admin. This component does not have access to the user email at
  // all in admin mode unfortunately. In the fullness of time we could fix that,
  // currently we disable it below
  const requestPasswordReset = async () => {
    const { data } = await mutate({variables: { email: getUserEmail(currentUser) }})
    flash(data?.resetPassword)
  } 

  // Since there are two urls from which this component can be rendered, with different terms, we have to
  // check both slug and documentId
  const isCurrentUser = (terms.slug && terms.slug === currentUser?.slug) || (terms.documentId && terms.documentId === currentUser?._id)

  const unlock = async () => {
    const { data } = await mutateUnlock({variables: { userSlug: terms.slug }})
    flash('Login unlocked')

    window.location.reload()
  }

  return (
    <div className={classes.root}>
      <Typography variant="display2" className={classes.header}>
        {preferredHeadingCase("Account Settings")}
      </Typography>
      <div className={classes.nonEditableUserInfo}>
        <div className={classes.nonEditableUserInfoItem}>
          <Typography variant="body2" className={classes.smallLabel}>
            Username
          </Typography>
          <Typography variant="body2" className={classes.userName}>
            {user?.username}
          </Typography>
        </div>

        <div className={classes.nonEditableUserInfoItem}>
          <Typography variant="body2" className={classes.smallLabel}>
            Email
          </Typography>
          <Typography variant="body2" className={classes.userName}>
            {user?.email}
          </Typography>
        </div>
      </div>

      {loadedUser && isLoginLocked(loadedUser) && <>
        <div className={classes.nonEditableUserInfo}>
          <div className={classes.loginLockInfoItem}>
            <Typography variant="body2" className={classes.smallLabel}>
              Login locked until:
            </Typography>
            <Typography variant="body2" className={classes.loginLockItem}>
              {loginLockedUntil(loadedUser)?.format("h:mma, MM/D")}
            </Typography>
          </div>
          <div className={classes.loginLockInfoItem}>
            <Button
              color="secondary"
              variant="outlined"
              className={classes.unlockButton}
              onClick={unlock}
            >
              Unlock login
            </Button>
          </div>
        </div>
      </>}

      {isCurrentUser && enableResetPassword && <Button
        color="secondary"
        variant="outlined"
        className={classes.resetButton}
        onClick={requestPasswordReset}
      >
        {preferredHeadingCase("Reset Password")}
      </Button>}

      <Components.WrappedSmartForm
        collectionName="Users"
        {...terms}
        removeFields={currentUser?.isAdmin ? [] : ["paymentEmail", "paymentInfo"]}
        successCallback={async (user: AnyBecauseTodo) => {
          if (user?.theme) {
            const theme = {...currentThemeOptions, ...user.theme};
            setTheme(theme);
            captureEvent("setUserTheme", theme);
          }

          // reconfigure datadog RUM in case they have changed their settings
          configureDatadogRum(user)

          flash(`Profile updated`);
          try {
            await client.resetStore()
          } finally {
            history.push(userGetProfileUrl(user))
          }
        }}
        queryFragment={getFragment('UsersEdit')}
        mutationFragment={getFragment('UsersEdit')}
        showRemove={false}
        submitLabel="Save"
        repeatErrors={true}
      />
    </div>
  );
};


const UsersEditFormComponent = registerComponent('UsersEditForm', UsersEditForm, {styles});

declare global {
  interface ComponentTypes {
    UsersEditForm: typeof UsersEditFormComponent
  }
}
