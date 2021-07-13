import React, { useState, useCallback, FormEventHandler } from 'react'
import styled from '../../../../shared/lib/styled'
import { Spinner } from '../../atoms/Spinner'
import { stringify } from 'querystring'
import cc from 'classcat'
import { createLoginEmailRequest } from '../../../api/auth/email'
import { boostHubBaseUrl } from '../../../lib/consts'
import Button from '../../../../shared/components/atoms/Button'

interface EmailFormProps {
  query?: any
  disabled: boolean
  setDisabled: (val: boolean) => void
  setError: (err: unknown) => void
  email?: string
}

const EmailForm = ({
  query,
  disabled,
  setDisabled,
  setError,
  email: initialEmail = '',
}: EmailFormProps) => {
  const [step, setStep] = useState<'email' | 'code'>('email')
  const [email, setEmail] = useState<string>(initialEmail)
  const [code, setCode] = useState<string>('')
  const [sending, setSending] = useState<boolean>(false)

  const emailChangeHandler: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setEmail(event.target.value)
      setStep('email')
    },
    [setEmail]
  )

  const codeChangeHandler: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setCode(event.target.value)
    },
    [setCode]
  )

  const onSubmit: FormEventHandler = useCallback(
    async (event) => {
      event?.preventDefault()
      if (disabled || sending || step === 'code') {
        return
      }
      setSending(true)
      setDisabled(true)

      try {
        await createLoginEmailRequest({ email, ...query })
        setStep('code')
      } catch (error) {
        setError(error)
      }

      setSending(false)
      setDisabled(false)
    },
    [disabled, sending, setDisabled, step, setStep, email, query, setError]
  )

  if (step === 'code') {
    const linkIsDisabled = code.length < 7 || disabled
    return (
      <StyledEmailForm onSubmit={onSubmit}>
        <label>Email</label>
        <input
          type='text'
          value={email}
          placeholder='Email...'
          onChange={emailChangeHandler}
        />
        <p className='text-center'>
          We just sent a temporary signin code to your email. <br /> Please
          check your inbox.
        </p>
        <input
          type='text'
          value={code}
          placeholder='Paste signin code'
          onChange={codeChangeHandler}
        />
        <Button
          variant='primary'
          className={cc(['submit-email', linkIsDisabled && 'disabled'])}
          onClick={() => {
            setDisabled(true)
            setSending(true)
            window.location.href = `${boostHubBaseUrl}/api/oauth/email/callback?${stringify(
              {
                code,
                email,
              }
            )}`
          }}
          disabled={linkIsDisabled}
        >
          {sending ? (
            <Spinner className='relative' />
          ) : (
            'Continue with signin code'
          )}
        </Button>
      </StyledEmailForm>
    )
  }

  return (
    <StyledEmailForm onSubmit={onSubmit}>
      <label>EMAIL</label>
      <input
        type='text'
        value={email}
        placeholder='Email...'
        onChange={emailChangeHandler}
      />
      <Button
        className='submit-email'
        variant='primary'
        type='submit'
        disabled={disabled}
        size='lg'
      >
        {sending ? <Spinner className='relative' /> : 'Continue with email'}
      </Button>
    </StyledEmailForm>
  )
}

export default EmailForm

const StyledEmailForm = styled.form`
  margin-left: auto;
  margin-right: auto;
  color: #9da0a5;
  label {
    display: block;
    margin: ${({ theme }) => theme.sizes.spaces.sm}px auto;
    text-align: left;
    width: 100%;
  }
  input {
    padding: ${({ theme }) => theme.sizes.spaces.sm}px
      ${({ theme }) => theme.sizes.spaces.sm}px;
    border: none;
    border-radius: 2px;
    border: 1px solid #d2d3d6;
    ::placeholder {
      color: #45474b;
    }
    width: 100%;
    height: 40px;
  }

  .submit-email {
    width: 100%;
    margin: ${({ theme }) => theme.sizes.spaces.sm}px 0;
  }

  a.submit-email.disabled {
    opacity: 0.3;
    pointer-events: none;
  }

  .text-center {
    margin-top: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
`
