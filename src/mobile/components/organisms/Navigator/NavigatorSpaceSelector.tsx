import React, { useCallback } from 'react'
import {
  useContextMenu,
  MenuTypes,
  NormalMenuItem,
} from '../../../../shared/lib/stores/contextMenu'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import { useRouter } from '../../../../cloud/lib/router'
import { SerializedTeamInvite } from '../../../../cloud/interfaces/db/teamInvite'
import { getHexFromUUID } from '../../../../cloud/lib/utils/string'
import { stringify as stringifyQueryString } from 'querystring'
import RoundedImage from '../../../../shared/components/atoms/RoundedImage'
import Icon from '../../../../shared/components/atoms/Icon'
import { mdiUnfoldMoreHorizontal } from '@mdi/js'
import styled from '../../../../shared/lib/styled'
import SpaceMenuItemLabel from './SpaceMenuItemLabel'
import useSignOut from '../../../lib/signOut'

interface NavigatorSpaceSelectorProps {
  currentTeam?: SerializedTeam
  teams: SerializedTeam[]
  invites: SerializedTeamInvite[]
}

const NavigatorSpaceSelector = ({
  currentTeam,
  teams,
  invites,
}: NavigatorSpaceSelectorProps) => {
  const { popup } = useContextMenu()
  const { push } = useRouter()
  const signOut = useSignOut()

  const popupSpaceSelect = useCallback(
    (event: React.MouseEvent) => {
      popup(event, [
        ...teams.map((team) => {
          return {
            type: MenuTypes.Normal,
            label: <SpaceMenuItemLabel team={team} />,
            active: currentTeam?.id === team.id,
            onClick: () => {
              push(`/${team.domain}`)
            },
          }
        }),
        ...invites.map((invite) => {
          return {
            type: MenuTypes.Normal,
            label: <SpaceMenuItemLabel team={invite.team} />,
            onClick: () => {
              const query = {
                t: invite.team.id,
                i: getHexFromUUID(invite.id),
              }

              push(`/invite?${stringifyQueryString(query)}`)
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
        {
          type: MenuTypes.Separator,
        },
        {
          type: MenuTypes.Normal,
          label: 'Sign Out',
          onClick: () => {
            signOut()
          },
        },
      ] as NormalMenuItem[])
    },
    [popup, teams, invites, currentTeam, push, signOut]
  )
  return (
    <Container className='space-selector' onClick={popupSpaceSelect}>
      {currentTeam != null ? (
        <>
          <RoundedImage
            className='space-selector__icon'
            url={currentTeam.icon?.location}
            alt={currentTeam.name}
            size={22}
          />
          <div className='space-selector__label'>{currentTeam.name}</div>
        </>
      ) : (
        <div className='space-selector__empty'>No team selected</div>
      )}

      <Icon
        size={20}
        className='space-selector__select-icon'
        path={mdiUnfoldMoreHorizontal}
      />
    </Container>
  )
}

export default NavigatorSpaceSelector

const Container = styled.button`
  &.space-selector {
    display: flex;
    flex: 1;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.variants.secondary.text};
    border: none;
    height: 100%;
    align-items: center;
    padding: 0 ${({ theme }) => theme.sizes.spaces.sm}px;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;

    &:active,
    &:hover {
      filter: brightness(103%);
    }
  }

  .space-selector__icon {
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
  }

  .space-selector__label {
    flex: 1;
    text-align: left;
    color: ${({ theme }) => theme.colors.variants.secondary.text};
    padding: 0 ${({ theme }) => theme.sizes.spaces.sm}px;
  }

  .space-selector__empty {
    color: ${({ theme }) => theme.colors.text.subtle};
  }

  .space-selector__select-icon {
    color: ${({ theme }) => theme.colors.variants.secondary.text};
  }
`
