import React, { useCallback } from 'react'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import SignInForm from '../../../cloud/components/molecules/SignInForm'
import { useRouter } from '../../../cloud/lib/router'
import styled from '../../../shared/lib/styled'
import {
  useContextMenu,
  MenuTypes,
  NormalMenuItem,
} from '../../../shared/lib/stores/contextMenu'
import SpaceMenuItemLabel from '../organisms/Navigator/SpaceMenuItemLabel'
import Icon from '../../../shared/components/atoms/Icon'
import { mdiUnfoldMoreHorizontal } from '@mdi/js'
import UserIcon from '../../../cloud/components/atoms/UserIcon'
import Button from '../../../shared/components/atoms/Button'
import useSignOut from '../../lib/signOut'
import { mobileBaseUrl } from '../../../cloud/lib/consts'
import NativeMobileAuthForm from '../organisms/NativeMobileAuthForm'
import { agentType } from '../../lib/nativeMobile'

const RootPage = () => {
  const { globalData } = useGlobalData()
  const { push } = useRouter()

  const { popup } = useContextMenu()

  const signOut = useSignOut()

  const popupSpaceSelect = useCallback(
    (event: React.MouseEvent) => {
      popup(event, [
        ...globalData.teams.map((team) => {
          return {
            type: MenuTypes.Normal,
            label: <SpaceMenuItemLabel team={team} />,
            onClick: () => {
              push(`/${team.domain}`)
            },
          }
        }),
        {
          type: MenuTypes.Separator,
        },
        {
          type: MenuTypes.Normal,
          label: 'Create a space',
          onClick: () => {
            push('/cooperate')
          },
        },
      ] as NormalMenuItem[])
    },
    [globalData.teams, popup, push]
  )
  if (globalData.currentUser == null) {
    return (
      <Container>
        <div className='intro'>
          <img
            className='intro__logo'
            src='/static/images/logo.png'
            width='80'
            height='80'
          />

          <h1 className='intro__heading'>Welcome to Boost Note!</h1>
          <p className='intro__description'>
            Boost Note is a powerful, lightspeed collaborative workspace for
            developer teams.
          </p>
        </div>
        {agentType === 'ios-native' || agentType === 'android-native' ? (
          <NativeMobileAuthForm />
        ) : (
          <SignInForm redirectTo={mobileBaseUrl} width='100%' mobile={true} />
        )}
      </Container>
    )
  }
  return (
    <Container>
      <div className='intro'>
        <img
          className='intro__logo'
          src='/static/images/logo.png'
          width='80'
          height='80'
        />
        <h1 className='intro__heading'>Welcome to Boost Note!</h1>
        <div className='intro__user'>
          <span className='intro__user__prefix'>Signed in as </span>
          <UserIcon
            className='intro__user__icon'
            user={globalData.currentUser}
          />{' '}
          <span className='intro__user__displayName'>
            {globalData.currentUser.displayName}
          </span>
          <Button variant='link' onClick={signOut}>
            (Sign Out)
          </Button>
        </div>
      </div>

      <button className='speceSelector' onClick={popupSpaceSelect}>
        Select Space
        <Icon
          size={20}
          className='space-selector__select-icon'
          path={mdiUnfoldMoreHorizontal}
        />
      </button>
    </Container>
  )
}

export default RootPage

const Container = styled.div`
  padding: ${({ theme }) => theme.sizes.spaces.md}px;
  .intro {
    margin-top: ${({ theme }) => theme.sizes.spaces.xl}px;
  }
  .intro__logo {
  }
  .intro__heading {
    font-size: ${({ theme }) => theme.sizes.fonts.l}px;
  }
  .intro__description {
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }

  .speceSelector {
    display: flex;
    padding: ${({ theme }) => theme.sizes.spaces.sm}px;
    width: 100%;
    height: 48px;
    align-items: center;
    border: none;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.variants.secondary.text};
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }

  .intro__user {
    display: flex;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.md}px;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
    align-items: center;
  }
  .intro__user__prefix {
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
  }

  .intro__user__icon {
    margin-right: ${({ theme }) => theme.sizes.spaces.xsm}px;
  }
  .intro__user__displayName {
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
`
