import React, { useState } from 'react'
import cc from 'classcat'
import styled from '../../../../lib/styled'
import { stringify } from 'querystring'
import IconMdi from '../../IconMdi'
import { mdiGithub } from '@mdi/js'
import { boostHubBaseUrl } from '../../../../lib/consts'

interface GithubLoginButtonProps {
  query?: any
  style?: React.CSSProperties
  className?: string
  disabled: boolean
  setDisabled: (val: boolean) => void
}

const GithubLoginButton = ({
  query,
  className,
  style,
  disabled,
  setDisabled,
}: GithubLoginButtonProps) => {
  const [sending, setSending] = useState<boolean>(false)
  const loginHref = `${boostHubBaseUrl}/api/oauth/github${
    query != null ? `?${stringify(query)}` : ''
  }`

  return (
    <StyledGithubButton
      style={style}
      className={cc(['login-github-btn', disabled && 'disabled', className])}
      onClick={() => {
        setDisabled(true)
        setSending(true)
      }}
      href={loginHref}
    >
      <IconMdi path={mdiGithub} />
      {sending ? <span>Signing in...</span> : <span>Continue with GitHub</span>}
    </StyledGithubButton>
  )
}

export default GithubLoginButton

const StyledGithubButton = styled.a`
  display: inline-block;
  text-decoration: none;
  width: 400px;
  height: 40px;
  line-height: 10px;
  text-align: center;
  cursor: pointer;
  padding: 8px 10px;
  border-radius: 4px;
  background-color: #24292e;
  color: #fff;
  font-size: ${({ theme }) => theme.fontSizes.small}px;
  align-items: center;
  outline: 0;

  &.disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  &:hover,
  &:focus {
    background-color: #131619;
    color: #fff;
  }

  svg,
  span {
    vertical-align: middle;
  }
  svg {
    font-size: 26px;
    margin-right: ${({ theme }) => theme.space.xsmall}px;
  }
  span {
    display: inline-block;
  }
`
