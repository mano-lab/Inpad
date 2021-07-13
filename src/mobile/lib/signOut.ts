import { useCallback } from 'react'
import { boostHubBaseUrl, mobileBaseUrl } from '../../cloud/lib/consts'

function useSignOut() {
  return useCallback(() => {
    window.location.href = `${boostHubBaseUrl}/api/oauth/signout?redirectTo=${mobileBaseUrl}`
  }, [])
}

export default useSignOut
