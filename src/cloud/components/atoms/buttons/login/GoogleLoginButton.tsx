import React, { useState, useCallback } from 'react'
import cc from 'classcat'
import styled from '../../../../lib/styled'
import GoogleLogin from 'react-google-login'
import { postGoogleLoginCallback } from '../../../../api/auth/google'
import { useRouter } from '../../../../lib/router'
import IconMdi from '../../IconMdi'
import { mdiGoogle } from '@mdi/js'

interface GoogleLoginButtonProps {
  redirectTo?: string
  isSignup?: boolean
  style?: React.CSSProperties
  className?: string
  query?: any
  disabled: boolean
  setDisabled: (val: boolean) => void
  setError: (err: unknown) => void
}

const GoogleLoginButton = ({
  className,
  style,
  query,
  disabled,
  setDisabled,
  setError,
}: GoogleLoginButtonProps) => {
  const [sending, setSending] = useState<boolean>(false)
  const [googleAuthIsInitialized, setGoogleAuthIsInitialized] = useState<
    boolean
  >(true)
  const { push } = useRouter()

  const responseGoogle = useCallback(
    async (response: any) => {
      setSending(true)
      setDisabled(true)
      setError(undefined)
      try {
        const data = await postGoogleLoginCallback({
          ...query,
          tokenId: response.tokenId,
          accessToken: response.accessToken,
          googleId: response.googleId,
          scope: response.tokenObj.scope,
        })
        push(data.redirectTo)
      } catch (error) {
        setError(error)
        setDisabled(false)
        setSending(false)
      }
    },
    [query, setError, push, setDisabled]
  )

  const errorHandler = (response: any) => {
    console.log(response.error)
    if (response.error === 'popup_closed_by_user') {
      return
    }

    if (response.error === 'idpiframe_initialization_failed') {
      setGoogleAuthIsInitialized(false)
      setError(
        `Third-party cookies and site data need to be enabled for Google Auth to work properly. Please adjust your browser settings.`
      )
      return
    }

    setError(response.error)
  }

  if (process.env.GOOGLE_CLIENT_ID == null) {
    return null
  }

  return (
    <GoogleLogin
      clientId={process.env.GOOGLE_CLIENT_ID}
      render={(renderProps) => (
        <StyledGoogleButton
          onClick={renderProps.onClick}
          disabled={
            renderProps.disabled ||
            sending ||
            disabled ||
            !googleAuthIsInitialized
          }
          style={style}
          className={cc(['login-google-btn g-signin2', className])}
        >
          <IconMdi path={mdiGoogle} />
          {sending ? (
            <span>Signing in...</span>
          ) : (
            <span>Continue with Google</span>
          )}
        </StyledGoogleButton>
      )}
      onSuccess={responseGoogle}
      onFailure={errorHandler}
      cookiePolicy={'single_host_origin'}
    />
  )
}

export default GoogleLoginButton

const StyledGoogleButton = styled.button`
  text-decoration: none;
  width: 100%;
  height: 40px;
  line-height: 10px;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 4px;
  background-color: #c5544c;
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.small}px;
  outline: none !important;

  &:disabled {
    opacity: 0.3;
  }

  &:hover,
  &:focus {
    background-color: #933730;
  }

  svg,
  span {
    vertical-align: middle;
  }
  svg {
    font-size: 24px;
    margin-right: ${({ theme }) => theme.space.xsmall}px;
  }
  span {
    display: inline-block;
  }
`
