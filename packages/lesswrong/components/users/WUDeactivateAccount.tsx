import React from 'react'
import { Components, registerComponent } from '../../lib/vulcan-lib'
import { useCurrentUser } from '../common/withUser'

const WUDeactivateAccount = (props: any)  => {
  const currentUser = useCurrentUser()

  if (!currentUser?.isAdmin) {
    return <div>Email community@wakingup.com if you'd like to deactivate your Waking Up Community account.</div>
  }

  return <>
    <Components.FormComponentCheckbox
        disabled
        {...props}
        label="Deactivate user"
      />
  </>
}

const WUDeactivateAccountComponent = registerComponent(
  'WUDeactivateAccount',
  WUDeactivateAccount,
)

declare global {
  interface ComponentTypes {
    WUDeactivateAccount: typeof WUDeactivateAccountComponent;
  }
}
