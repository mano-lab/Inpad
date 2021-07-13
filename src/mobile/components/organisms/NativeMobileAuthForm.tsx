import React, { useCallback, useEffect, useState } from 'react'
import { generateId } from '../../../lib/string'
import Button from '../../../shared/components/atoms/Button'
import { sendPostMessage } from '../../lib/nativeMobile'
import { boostHubBaseUrl } from '../../../cloud/lib/consts'
import { loginWithStateAndCode } from '../../../cloud/api/desktop/login'
import { createCustomEventEmitter } from '../../../cloud/lib/utils/events'
import MobileFormControl from '../atoms/MobileFormControl'
import { useEffectOnce } from 'react-use'
import { useRouter } from '../../../cloud/lib/router'
import Spinner from '../../../shared/components/atoms/Spinner'

export const nativeMobileAuthEventEmitter = createCustomEventEmitter<{
  state: string
  code: string
}>('native-mobile-auth')

const NativeMobileAuthForm = () => {
  const requestGithubLogin = useCallback(() => {
    const newAuthState = generateId()

    sendPostMessage({
      type: 'open-auth-link',
      state: newAuthState,
      url: `${boostHubBaseUrl}/desktop/login?state=${newAuthState}`,
    })
  }, [])

  useEffect(() => {
    const handler = (event: CustomEvent<{ state: string; code: string }>) => {
      const { state, code } = event.detail
      loginWithStateAndCode(state, code).then(() => {
        window.location.reload()
      })
    }
    nativeMobileAuthEventEmitter.listen(handler)

    return () => {
      nativeMobileAuthEventEmitter.unlisten(handler)
    }
  }, [])

  const [loading, setLoading] = useState(true)

  const { query } = useRouter()

  useEffectOnce(() => {
    console.log(location.href)
    if (typeof query.state !== 'string' || typeof query.code !== 'string') {
      setLoading(false)
      return
    }
    loginWithStateAndCode(query.state, query.code)
      .then(() => {
        window.location.reload()
      })
      .catch((error: Error) => {
        console.error(error)
        setLoading(false)
      })
  })

  if (loading) {
    return (
      <p>
        Loading... <Spinner />
      </p>
    )
  }

  return (
    <>
      <MobileFormControl>
        <Button onClick={requestGithubLogin}>Sign Up</Button>
      </MobileFormControl>
      <p>You can sign in via Google, Github and E-mail</p>
    </>
  )
}

export default NativeMobileAuthForm
