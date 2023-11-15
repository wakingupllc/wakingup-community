import { Components, registerComponent } from '../../lib/vulcan-lib';
import React, { useState, useRef, useEffect } from 'react';
import { gql, useMutation } from '@apollo/client';
import classNames from 'classnames';
import OTPInput, { OTPInputMethods } from './OTPInput';
import SimpleSchema from 'simpl-schema';
import { cdnAssetUrl } from '../../lib/routeUtil';
import { devLoginsAllowedSetting } from '../../lib/publicSettings';

const styles = (theme: ThemeType): JssStyles => ({
  root: {
    wordBreak: "normal",
    padding: 16,
    marginTop: 0,
    marginBottom: 0,
    width: "30rem",
    minHeight: "2.8125rem",
    marginLeft: "50%",
    transform: "translateX(-50%)",
    textAlign: "center",
    maxWidth: "100%",
  },
  input: {
    font: 'inherit',
    color: 'inherit',
    display: 'block',
    fontSize: '1.2rem',
    padding: 8,
    backgroundColor: theme.palette.panelBackground.default,
    width: '100%',
    height: 45,
  },
  submit: {
    font: 'inherit',
    color: theme.palette.text.alwaysWhite,
    background: theme.palette.primary.main,
    display: 'block',
    height: '100%',
    cursor: 'pointer',
    fontSize: '1rem',
    padding: '12px 30px',
    "&:disabled": {
      opacity: 0.5,
    }
  },
  enterCodeSubmit: {
    display: 'inline-block',
    marginTop: 16,
    width: 290,
  },
  error: {
    padding: 8,
    color: theme.palette.error.main,
    marginTop: "0.5em",
    marginLeft: -90,
    marginRight: -90,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  },
  options: {
    display: 'flex',
    justifyContent: 'center',
    fontSize: '1rem',
    marginTop: 10,
    padding: 4
  },
  splashLogo: {
    height: 'auto',
  },
  heading: {
    marginTop: "1.4rem !important",
    marginBottom: 20,
    fontWeight: "700 !important",
    color: "#222 !important",
  },
  topInstructions: {
    marginLeft: '-20px',
    marginRight: '-20px',
    marginBottom: 8,
    [theme.breakpoints.down('sm')]: {
      marginLeft: 0,
      marginRight: 0
    }
  },
  hideSm: {
    [theme.breakpoints.down('sm')]: {
      display: 'none'
    }
  },
  emailAndButton: {
    display: 'flex',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginTop: 16,
  },
  instructions: {
    fontSize: '1.3rem',
    marginBottom: 8
  },
  otpInput: {
    appearance: 'textfield',
    background: 'rgb(255, 255, 255)',
    borderRadius: '0.25rem',
    border: '1px solid rgba(0, 0, 0, 0.3)',
    color: 'rgb(14, 21, 41)',
    fontSize: '1.0625rem',
    height: 45,
    width: 62,
    lineHeight: '1.235',
    minWidth: '0px',
    padding: '0px 0.75rem',
    textAlign: 'center'
  },
  otpContainer: {
    justifyContent: 'center',
    gap: '5px',
  },
  returnToLogin: {
    display: 'block',
    textDecoration: 'underline',
    marginTop: 6,
    '&:visited': {
      color: theme.palette.text.primary + ' !important'
    }
  }
})

const requestLoginCodeMutation = gql`
  mutation requestLoginCode($email: String) {
    requestLoginCode(email: $email) {
      result
    }
  }
`

const codeLoginMutation = gql`
  mutation codeLogin($email: String, $code: String) {
    codeLogin(email: $email, code: $code) {
      token
    }
  }
`

const chooseMutation = function(currentAction: possibleActions, oneOffCodeRequest: boolean) {
  if (oneOffCodeRequest) return requestLoginCodeMutation
  if (currentAction == "requestCode") return requestLoginCodeMutation
  if (currentAction == "enterCode") return codeLoginMutation

  throw "Invalid currentAction"
}

type possibleActions = "requestCode" | "enterCode"

const currentActionToButtonText : Record<possibleActions, string> = {
  requestCode: "Next",
  enterCode: "Next"
}

type WULoginFormProps = {
  startingState?: possibleActions,
  immediateRedirect?: boolean,
  classes: ClassesType
}

export const WULoginForm = ({ startingState = "requestCode", classes }: WULoginFormProps) => {
  const [email, setEmail] = useState<string>("")
  const [oneTimeCode, setOneTimeCode] = useState<string>("")
  const [currentAction, setCurrentAction] = useState<possibleActions>(startingState)
  const [requestAnotherCode, setRequestAnotherCode] = useState<boolean>(false)
  // This currentActionToMutation thing is regrettably complicated, but the point
  // is to have a single useMutation call that shares one error state, so that
  // subsequent mutations overwrite the error state of the previous one.
  const [ mutate, { error } ] = useMutation(chooseMutation(currentAction, requestAnotherCode), { errorPolicy: 'all' })
  const [validationError, setValidationError] = useState<string>("")
  const [loading, setLoading] = useState<boolean>(false)
  const otpRef = useRef<OTPInputMethods>(null)

  useEffect(() => {
    // This regrettably complicated useEffect step is necessary because the requestAnotherCode boolean is a parameter
    // for the chooseMutation function that gets called by mutate(). If this were just called directly from the button,
    // we'd not be able to distinguish the intention to request a new code, rather than to enter a code.
    if (requestAnotherCode) {
      void withLoadingSpinner(async () => {
        setOneTimeCode("");
        otpRef.current?.focusFirstInput();

        const variables = { email }
        void mutate({ variables })
      })
      setRequestAnotherCode(false)
    }
  }, [requestAnotherCode, email, mutate]);

  const withLoadingSpinner = async function(inner: Function) {
    setLoading(true);
    inner()
    setLoading(false);
  }

  const errorMessage = function() {
    return error?.message || validationError
  }

  const showSendNewCodeLink = function() {
    return (currentAction === 'enterCode' && error?.graphQLErrors[0] as any)?.data?.invalidCode
  }

  const validateForm = function() {
    if (!SimpleSchema.RegEx.Email.test(email)) {
      setValidationError("Please enter a valid email address");
      return false;
    }
    setValidationError("");
    return true;
  }

  // submitFunction requests a code or enters a code, depending on the currentAction
  const submitFunction = (e: AnyBecauseTodo) => {
    e.preventDefault();

    if (!validateForm()) return;

    void withLoadingSpinner(async () => {
      const variables = { email, code: oneTimeCode }
      const { data } = await mutate({ variables })

      if (data?.requestLoginCode?.result === "success") {
        setCurrentAction("enterCode")
      }
      if (data?.codeLogin?.token) location.reload()
    })
  }

  // requestNewCode is called by the link that requests a new code after the user entered an incorrect code
  const requestNewCode = async function() {
    setRequestAnotherCode(true)
  }

  const { Loading } = Components;

  return <Components.ContentStyles contentType="commentExceptPointerEvents">
    <form className={classes.root} onSubmit={submitFunction}>
      <img src={cdnAssetUrl("SplashLogo.png")} alt="logo" width="358px" height="97px" className={classes.splashLogo} />
      <h1 className={classes.heading}>Sign in</h1>
      {currentAction === "requestCode" && <>
        <p className={classes.topInstructions}>Enter the email associated with your account,<br className={classes.hideSm} /> and we’ll send you a code to sign in to the community.</p>
        {!error && <div className={classes.emailAndButton}>
          <input value={email} type="email" name="email" placeholder={"Email Address"} className={classes.input} onChange={event => setEmail(event.target.value)}/>
          <input type="submit" className={classes.submit} value={currentActionToButtonText[currentAction]} />
        </div>}
      </>}
      {currentAction === "enterCode" && <>
        <p className={classes.instructions}>We have sent a four-digit verification code to {email}. Please enter it below.</p>
        {devLoginsAllowedSetting.get() && <p>(Dev server only: you can use the test code: 1234)</p>}
        <OTPInput
          ref={otpRef}
          inputStyle={classes.otpInput}
          containerStyle={classes.otpContainer}
          numInputs={4}
          onChange={setOneTimeCode}
          renderSeparator={<span>&nbsp;</span>}
          value={oneTimeCode}
          inputType={'tel'}
          renderInput={(props) => <input {...props} />}
          shouldAutoFocus
        />
        <input
          type="submit"
          className={classNames(classes.submit, classes.enterCodeSubmit)}
          value={currentActionToButtonText[currentAction]}
          disabled={oneTimeCode.length !== 4} />
      </>}
      {errorMessage() && <div className={classes.error}>{errorMessage()}
        {showSendNewCodeLink() && <>&nbsp;<a href="#" onClick={() => { void requestNewCode() }}>Send a new code</a>.</>}
      </div>}
      {(error || currentAction === "enterCode") && <a href="/" className={classes.returnToLogin}>Return to login</a>}
      {loading && <Loading />}
    </form>
  </Components.ContentStyles>;
}

const WULoginFormComponent = registerComponent('WULoginForm', WULoginForm, { styles });

declare global {
  interface ComponentTypes {
    WULoginForm: typeof WULoginFormComponent
  }
}
