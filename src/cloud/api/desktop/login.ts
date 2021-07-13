import { callApi } from '../../lib/client'

export interface CreateDesktopLoginResponseBody {
  code: string
}

export async function createDesktopLoginRequest(state: string) {
  const data = await callApi<CreateDesktopLoginResponseBody>(
    'api/desktop/login/request',
    {
      method: 'post',
      search: {
        state,
      },
    }
  )

  return data
}

export async function loginWithStateAndCode(state: string, code: string) {
  const data = await callApi<{}>('api/desktop/login', {
    method: 'post',
    search: {
      state,
      code,
    },
  })

  return data
}
