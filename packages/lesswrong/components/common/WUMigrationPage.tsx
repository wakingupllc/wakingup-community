import React from 'react'
import {Components, registerComponent} from '../../lib/vulcan-lib'
import {useCurrentUser} from './withUser.tsx'

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    margin: 'auto',
    display: 'flex',
    flexDirection: 'column',
    maxWidth: 845,
    marginTop: '7em',
    [theme.breakpoints.down('xs')]: {
      marginTop: 'unset',
    },
    boxShadow: '2px 2px 12px 0px rgba(50, 89, 84, 0.15)',
    borderRadius: 6,
    backgroundColor: '#F9F9F9',
  },
  header: {
    fontWeight: 400,
    fontSize: 14,
    color: '#757575',
    fontFamily: theme.typography.fontFamily,
    backgroundColor: theme.palette.panelBackground.default,
    borderTopLeftRadius: 6,
    borderTopRightRadius: 6,
    borderBottom: `1px solid ${theme.palette.grey[250]}`,
    padding: '1em 1.7rem',
    display: 'flex',
    justifyContent: 'center',
  },
  body: {
    display: 'flex',

    fontFamily: theme.typography.fontFamily,
    fontSize: 14,
    color: theme.palette.text.normal,
    flexWrap: 'wrap',
    padding: '65px',
    gap: '65px',
  },
  message: {
    display: 'flex',
    flexDirection: 'column',
    flex: 1,
    marginTop: '2em',
  },
  migrationImage: {
    flex: 1,
    minWidth: '15em',
  },
  messageHeader: {
    fontWeight: 700,
    fontSize: 22,
    lineHeight: '125%',
    marginBottom: '1rem',
  },
  messageBody: {
    fontSize: 14,
    lineHeight: '125%',
    color: '#757575',
  },
})

const WUMigrationPage = ({classes}: {
  classes: ClassesType
}) => {
  const user = useCurrentUser()
  if (user?.isAdmin) return <Components.WakingUpHome/>

  return <div className={classes.root}>
    <div className={classes.header}>
      Migration: March 11 - March 13, 2024
    </div>
    <div className={classes.body}>
      <img className={classes.migrationImage} src={'/migration-box.svg'}/>
      <div className={classes.message}>
        <div className={classes.messageHeader}>
          We’re moving.
        </div>
        <div className={classes.messageBody}>
          The Waking Up Community has found a platform that we think can better serve the needs of our members, so we’re
          currently in the midst of migrating. We’ll make sure to notify everyone once the new site is live. Thank you
          for your patience!
        </div>
      </div>
    </div>
  </div>
}

const WUMigrationPageComponent = registerComponent('WUMigrationPage', WUMigrationPage, {styles})

declare global {
  interface ComponentTypes {
    WUMigrationPage: typeof WUMigrationPageComponent
  }
}
