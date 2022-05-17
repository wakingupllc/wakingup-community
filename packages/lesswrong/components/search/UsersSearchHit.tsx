import { Components, registerComponent } from '../../lib/vulcan-lib';
import { userGetProfileUrl } from '../../lib/collections/users/helpers';
import { Link } from '../../lib/reactRouterWrapper';
import PersonIcon from '@material-ui/icons/Person';
import React from 'react';
import type { Hit } from 'react-instantsearch-core';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    padding: 10,
    paddingTop: 2,
    paddingBottom: 2,
    display: 'flex',
    alignItems: 'center',
  },
  icon: {
    width: 20,
    color: theme.palette.grey[500],
    marginRight: 12,
    marginLeft: 4
  }
})

const isLeftClick = (event: MouseEvent): boolean => {
  return event.button === 0 && !event.ctrlKey && !event.metaKey;
}

const UsersSearchHit = ({hit, clickAction, classes}: {
  hit: Hit<any>,
  clickAction?: any,
  classes: ClassesType,
}) => {
  const { LWTooltip, MetaInfo, FormatDate } = Components
  const user = hit as AlgoliaUser;
  return <div className={classes.root}>
    <LWTooltip title="User"><PersonIcon className={classes.icon} /></LWTooltip>
    <Link to={userGetProfileUrl(user)} onClick={(event: MouseEvent) => isLeftClick(event) && clickAction && clickAction()}>
      <MetaInfo>
        {user.displayName}
      </MetaInfo>
      <MetaInfo>
        <FormatDate date={user.createdAt}/>
      </MetaInfo>
      <MetaInfo>
        {user.karma||0} points
      </MetaInfo>
    </Link>
  </div>
}

const UsersSearchHitComponent = registerComponent("UsersSearchHit", UsersSearchHit, {styles});

declare global {
  interface ComponentTypes {
    UsersSearchHit: typeof UsersSearchHitComponent
  }
}

