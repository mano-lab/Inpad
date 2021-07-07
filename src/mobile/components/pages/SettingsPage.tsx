import React, { useCallback, useState } from 'react'
import styled from '../../../shared/lib/styled'
import { saveUserInfo, updateUserIcon } from '../../../cloud/api/users'
import {
  getSettingsPageData,
  SettingsPageResponseBody,
} from '../../../cloud/api/pages/settings'
import ErrorBlock from '../../../cloud/components/atoms/ErrorBlock'
import Spinner from '../../../shared/components/atoms/Spinner'
import { getTeamURL } from '../../../cloud/lib/utils/patterns'
import { buildIconUrl } from '../../../cloud/api/files'
import Icon from '../../../shared/components/atoms/Icon'
import { mdiAccountCircleOutline } from '@mdi/js'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import { useRouter } from '../../../cloud/lib/router'
import { parse as parseQuery } from 'querystring'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import Button from '../../../shared/components/atoms/Button'
import NavigationBarContainer from '../atoms/NavigationBarContainer'

import NavigationBarButton from '../atoms/NavigationBarButton'
import useSignOut from '../../lib/signOut'
import MobileFormControl from '../atoms/MobileFormControl'

const SettingsPage = ({ currentUser }: SettingsPageResponseBody) => {
  const [displayName, setDisplayName] = useState<string>(
    currentUser.displayName
  )
  const [sending, setSending] = useState<boolean>(false)
  const [error, setError] = useState<unknown>()
  const {
    globalData: { teams },
    setPartialGlobalData,
  } = useGlobalData()
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(
    currentUser.icon != null ? buildIconUrl(currentUser.icon.location) : null
  )
  const { push, search } = useRouter()
  const signOut = useSignOut()

  const changeHandler: React.ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      if (
        event.target != null &&
        event.target.files != null &&
        event.target.files.length > 0
      ) {
        const file = event.target.files[0]
        setIconFile(file)
        setFileUrl(URL.createObjectURL(file))
      }
    },
    []
  )

  const changeDisplayName = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayName(event.target.value)
    },
    []
  )

  const changeInfo = useCallback(
    async (e: any) => {
      e.preventDefault()
      if (currentUser == null) {
        return
      }
      setSending(true)
      const query = parseQuery(search.slice(1))
      try {
        await saveUserInfo({ displayName })
        const user = { ...currentUser!, displayName }
        if (iconFile != null) {
          const { icon } = await updateUserIcon(iconFile)
          user.icon = icon
        }
        setPartialGlobalData({ currentUser: user })
        const finalRedirect =
          typeof query.redirect === 'string'
            ? query.redirect
            : teams.length > 0
            ? getTeamURL(teams[0])
            : `/cooperate`

        push(finalRedirect)
      } catch (error) {
        setError(error)
      }
      setSending(false)
    },
    [
      currentUser,
      displayName,
      teams,
      push,
      setPartialGlobalData,
      iconFile,
      search,
    ]
  )

  return (
    <Container>
      <NavigationBarContainer
        right={
          <NavigationBarButton onClick={signOut}>Log Out</NavigationBarButton>
        }
        label='Register'
      />
      <div className='body'>
        <h2>Welcome to Boost Note</h2>
        <p>First, tell us a bit about yourself.</p>

        <form onSubmit={changeInfo}>
          <div className='body__profile'>
            {fileUrl != null ? (
              <img src={fileUrl} className='body__profile__photo' />
            ) : (
              <Icon
                path={mdiAccountCircleOutline}
                className='body__profile__icon'
                size={100}
              />
            )}
            <label htmlFor='profile' className='body__profile__label'>
              {fileUrl == null ? 'Add a photo' : 'Change your photo'}
            </label>

            <input
              id='profile'
              name='profile'
              accept='image/*'
              type='file'
              onChange={changeHandler}
            />
          </div>
          <MobileFormControl>
            <label htmlFor='display-name'>Username</label>
            <input
              type='text'
              name='display-name'
              id='display-name'
              placeholder='Username...'
              value={displayName}
              onChange={changeDisplayName}
            />
          </MobileFormControl>
          {error != null && <ErrorBlock error={error} />}
          <MobileFormControl>
            <Button type='submit' disabled={sending} variant='primary'>
              {sending ? (
                <Spinner style={{ position: 'relative', top: 0, left: 0 }} />
              ) : (
                'Continue'
              )}
            </Button>
          </MobileFormControl>
        </form>
      </div>
    </Container>
  )
}

const Container = styled.div`
  .body {
    padding: ${({ theme }) => theme.sizes.spaces.md}px;
  }
  .body__profile {
    margin: ${({ theme }) => theme.sizes.spaces.md}px 0;
    text-align: center;
  }
  .body__profile__icon {
    display: block;
    margin: 0 auto;
    width: 100px;
    height: 100px;
    color: ${({ theme }) => theme.colors.border.second};
  }
  .body__profile__label {
    font-size: ${({ theme }) => theme.sizes.fonts.l}px;
    color: ${({ theme }) => theme.colors.text.subtle};
    text-align: center;
    display: block;
    cursor: pointer;
    transition: 200ms color;

    &:hover,
    &:active,
    &:focus {
      color: ${({ theme }) => theme.colors.icon.active};
    }

    &:disabled {
      &:hover,
      &:focus {
        cursor: not-allowed;
      }
    }
  }

  #profile {
    display: none;
  }

  .body__profile__photo {
    display: block;
    margin: auto;
    object-fit: cover;
    width: 100px;
    height: 100px;
    background: ${({ theme }) => theme.colors.background.secondary};
    border: 1px solid ${({ theme }) => theme.colors.border.second};
    border-radius: 100%;
  }
`

SettingsPage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getSettingsPageData(params)
  return result
}

export default SettingsPage
