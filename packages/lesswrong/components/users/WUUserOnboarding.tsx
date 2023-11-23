import React, {useState} from 'react'
import {gql, useMutation} from '@apollo/client'
import Checkbox from '@material-ui/core/Checkbox'
import FormControlLabel from '@material-ui/core/FormControlLabel'
import TextField, {TextFieldProps} from '@material-ui/core/TextField'
import {siteNameWithArticleSetting} from '../../lib/instanceSettings'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {TosLink} from '../posts/PostsAcceptTos'
import {textFieldContainerStyles, textFieldStyles} from '../form-components/MuiTextField.tsx'
import {useTimezone} from '../common/withTimezone.tsx'
import classNames from 'classnames'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    background: theme.palette.panelBackground.default,
    padding: '40px 22px',
    borderRadius: 6,

    '& .MuiIconButton-root': {
      paddingTop: 7,
      paddingBottom: 7,
    },
  },
  title: {
    marginTop: 0,
    [theme.breakpoints.down('md')]: {
      fontSize: 28,
    },
    color: theme.palette.text.normal,
    fontWeight: 700,
    fontSize: 30.8,
  },
  section: {
    marginTop: theme.spacing.unit * 3,
  },
  sectionHeadingText: {
    fontFamily: theme.typography.fontFamily,
    color: theme.palette.text.normal,
    fontWeight: 700,
    fontSize: 22,
  },
  sectionHelperText: {
    '& a': {
      color: theme.palette.primary.main,
      textDecoration: 'underline',
    },
    marginBottom: "0.8em",
  },
  submitButtonSection: {
    marginTop: theme.spacing.unit * 3,
  },
  formInput: {
    ...textFieldStyles(theme),
  },
  inputContainer: {
    ...textFieldContainerStyles(theme),
    borderRadius: 6,
    border: theme.palette.border.grey300,
    flexGrow: 1,
    marginRight: '0.5em',
    marginTop: '0.5em',
    "&.WUUserOnboarding-inputErrors": {
      border: `2px solid ${theme.palette.error.main}`,
    },
  },
  nameContainer: {
    display: 'flex',
    width: '100%',
    [theme.breakpoints.down('md')]: {
      flexWrap: 'wrap',
    },
  },
})

type WUUserOnboardingProps = {
  currentUser: UsersCurrent
  classes: ClassesType
}
const WUTextField = ({classes, ...props}: TextFieldProps & { classes: ClassesType }) => {
  return <div className={classNames(classes.inputContainer, { [classes.inputErrors]: props.error })}>
    <TextField
      {...props}
      InputProps={{disableUnderline: true}}
      className={classes.formInput}
    /></div>
}

const WUUserOnboarding: React.FC<WUUserOnboardingProps> = ({currentUser, classes}) => {
  const [username, setUsername] = useState('')
  const [firstName, setFirstName] = useState(currentUser.first_name)
  const [lastName, setLastName] = useState(currentUser.last_name)
  const [subscribeToDigest, setSubscribeToDigest] = useState(true)
  const [acceptedTos, setAcceptedTos] = useState(false)
  const [mapLocation, setMapLocation] = useState(currentUser.mapLocation)
  const [validationError, setValidationError] = useState('Username is empty by default')
  const [serverValidationErrors, setServerValidationErrors] = useState<any[]>([])
  const {timezone} = useTimezone()

  const [updateUser] = useMutation(gql`
    mutation WUUserOnboarding(
    $username: String!, 
    $subscribeToDigest: Boolean!, 
    $acceptedTos: Boolean!,
    $firstName: String, 
    $lastName: String, 
    $mapLocation: JSON,
    $timezone: String
    ) {
      WUUserOnboarding(
      username: $username, 
      subscribeToDigest: $subscribeToDigest, 
      acceptedTos: $acceptedTos,
      firstName: $firstName, 
      lastName: $lastName, 
      mapLocation: $mapLocation,
      timezone: $timezone
      ) {
        username
        slug
        displayName
      }
    }
  `, {refetchQueries: ['getCurrentUser']})
  const {SingleColumnSection, Typography, EAButton, LocationPicker, EAUsersProfileImage, FormErrors} = Components

  function validateUsername(username: string): void {
    if (username.length === 0) {
      setValidationError('Please enter a username')
      return
    }
    setValidationError('')
  }

  async function handleSave() {
    try {
      if (validationError) return

      await updateUser({
        variables: {
          username,
          subscribeToDigest,
          firstName,
          lastName,
          mapLocation,
          acceptedTos,
          timezone,
        },
      })
    } catch (err) {
      if (/username/.test(err.toString?.())) {
        setValidationError('Username is already taken')
      }
      // eslint-disable-next-line no-console
      console.error(err)
      setServerValidationErrors([err])
    }
  }

  const isErrorField = function(name: string) {
    return serverValidationErrors.some((err) => {
      // Detects SimpleValidationErrors but would probably need adjusting for regular validation errors
      const path = err?.graphQLErrors?.[0]?.data?.path
      return name === path
    })
  }

  return <SingleColumnSection>
    <form className={classes.root}>
      <Typography variant="display2" gutterBottom className={classes.title}>
        Welcome to {siteNameWithArticleSetting.get()} Beta
      </Typography>

      <Typography variant="body2">
        We're glad you're here. This is a place for Waking Up members to ask questions, share experiences,
        and support each other in meditation and beyond.
      </Typography>
      <br/>
      <Typography variant="body2">
        Before joining us in the community, take a moment to complete your profile.
      </Typography>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Create a username
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          Your username will appear next to your posts and comments. You’ll need to email us if you want to change this
          later.
        </Typography>
        <WUTextField
          label={'Username'}
          value={username}
          onChange={(event) => setUsername(event.target.value)}
          onBlur={(_event) => validateUsername(username)}
          classes={classes}
          inputProps={{maxLength: 70}}
          error={isErrorField('username')}
          required
        />
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Add your name
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          Your first and last name will appear on your profile page. We recommend using your real name in the community
          to encourage the highest quality interactions.
        </Typography>
        <div className={classes.nameContainer}>
          <WUTextField
            label="First name"
            value={firstName || ''}
            onChange={(event) => setFirstName(event.target.value)}
            classes={classes}
            required
          />
          <WUTextField
            label="Last name or initial"
            value={lastName || ''}
            onChange={(event) => setLastName(event.target.value)}
            classes={classes}
            required
          />
        </div>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Set your city
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          Your city will appear on your profile. (We may explore features that help you connect with other members near
          you in the future.)
        </Typography>
        <div className={classes.inputContainer}>
          <LocationPicker
            document={currentUser}
            path={'mapLocation'}
            value={mapLocation}
            label="City"
            updateCurrentValues={(it: any) => {
              setMapLocation(it['mapLocation'])
            }}
            locationTypes={['(cities)']}
          />
        </div>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Upload a profile photo
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          You can use a default avatar or add a photo of yourself (encouraged).
        </Typography>
        <br/>
        <EAUsersProfileImage user={currentUser}/>
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          Get a weekly email
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          We’ll send notes and recommended posts from the community about once a week. You can unsubscribe anytime.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={subscribeToDigest}
              onChange={event => setSubscribeToDigest(event.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              Subscribe to the weekly community digest
            </Typography>}
        />
      </div>

      <div className={classes.section}>
        <Typography variant="display1" className={classes.sectionHeadingText} gutterBottom>
          One last thing
        </Typography>
        <Typography variant="body2" className={classes.sectionHelperText}>
          Please accept our updated Terms of Service before joining the community.
        </Typography>
        <FormControlLabel
          control={
            <Checkbox
              checked={acceptedTos}
              onChange={event => setAcceptedTos(event.target.checked)}
            />
          }
          label={
            <Typography variant="body2">
              I accept the version of the Waking Up <TosLink>Terms of Service</TosLink> that was last updated on
              November 28, 2023.
            </Typography>}
        />
      </div>

      <FormErrors errors={serverValidationErrors}/>

      <div className={classes.submitButtonSection}>
        <EAButton onClick={handleSave} disabled={!!validationError || !acceptedTos || !firstName || !lastName}>
          Join the Community
        </EAButton>
      </div>
    </form>
  </SingleColumnSection>
}

const WUUserOnboardingComponent = registerComponent(
  'WUUserOnboarding',
  WUUserOnboarding,
  {styles},
)

declare global {
  interface ComponentTypes {
    WUUserOnboarding: typeof WUUserOnboardingComponent;
  }
}
