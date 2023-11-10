import React from 'react'
import {registerComponent} from '../../lib/vulcan-lib'

const WUDeactivateAccount = () =>
  <div>Email community@wakingup.com if you'd like to deactivate your Waking Up Community account.</div>

const WUDeactivateAccountComponent = registerComponent(
  'WUDeactivateAccount',
  WUDeactivateAccount,
)

declare global {
  interface ComponentTypes {
    WUDeactivateAccount: typeof WUDeactivateAccountComponent;
  }
}
