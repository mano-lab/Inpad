import React, { useCallback } from 'react'
import cc from 'classcat'
import styled from '../../../shared/lib/styled'
import SidebarTree, {
  SidebarNavCategory,
} from '../../../shared/components/organisms/Sidebar/molecules/SidebarTree'
import Spinner from '../../../shared/components/atoms/Spinner'
import { ControlButtonProps } from '../../../shared/lib/types'
import {
  useContextMenu,
  MenuTypes,
  NormalMenuItem,
} from '../../../shared/lib/stores/contextMenu'
import { SerializedTeam } from '../../../cloud/interfaces/db/team'
import { useRouter } from '../../../cloud/lib/router'
import { SerializedTeamInvite } from '../../../cloud/interfaces/db/teamInvite'
import { getHexFromUUID } from '../../../cloud/lib/utils/string'
import { stringify as stringifyQueryString } from 'querystring'
import RoundedImage from '../../../shared/components/atoms/RoundedImage'
import { buildIconUrl } from '../../../cloud/api/files'

type NavigatorProps = {
  sidebarExpandedWidth?: number
  sidebarResize?: (width: number) => void
  className?: string
  tree?: SidebarNavCategory[]
  treeControls?: ControlButtonProps[]
  treeTopRows?: React.ReactNode
  currentTeam?: SerializedTeam
  teams: SerializedTeam[]
  invites: SerializedTeamInvite[]
}

const Navigator = ({
  currentTeam,
  teams,
  invites,
  tree,
  treeControls,
  treeTopRows,
  className,
}: NavigatorProps) => {
  const { popup } = useContextMenu()
  const { push } = useRouter()

  const popupSpaceSelect = useCallback(
    (event: React.MouseEvent) => {
      popup(event, [
        ...teams.map((team) => {
          return {
            type: MenuTypes.Normal,
            label: (
              <>
                <RoundedImage
                  url={
                    team.icon != null
                      ? buildIconUrl(team.icon.location)
                      : undefined
                  }
                  size={22}
                  alt={team.name}
                />
                {team.name}
              </>
            ),
            active: currentTeam?.id === team.id,
            onClick: () => {
              push(`/${team.domain}`)
            },
          }
        }),
        ...invites.map((invite) => {
          return {
            type: MenuTypes.Normal,
            label: invite.team.name,
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
      ] as NormalMenuItem[])
    },
    [popup, teams, invites, currentTeam, push]
  )

  return (
    <SidebarContainer className={cc(['sidebar', className])}>
      <div>
        <button onClick={popupSpaceSelect}>
          {currentTeam != null ? currentTeam.name : 'No team selected'}
        </button>
      </div>

      <div className='sidebar--expanded__wrapper'>
        {tree == null ? (
          <Spinner className='sidebar__loader' />
        ) : (
          <SidebarTree
            tree={tree}
            topRows={treeTopRows}
            treeControls={treeControls}
          />
        )}
      </div>
    </SidebarContainer>
  )
}

export default Navigator

const SidebarContainer = styled.div`
  display: flex;
  flex-direction: row;
  flex-wrap: nowrap;
  align-items: top;
  flex: 0 0 auto;
  height: 100vh;

  .sidebar__loader {
    margin: auto;
    position: absolute;
    top: 0;
    bottom: 0;
    left: 0;
    right: 0;
  }

  .application__sidebar--electron .sidebar__context__icons {
    display: none;
  }

  .sidebar--expanded {
    border-right: 1px solid ${({ theme }) => theme.colors.border.main};
    height: 100%;
    max-height: 100%;
    position: relative;
  }

  .sidebar--expanded__wrapper {
    height: 100%;
    overflow: auto;
  }
`
