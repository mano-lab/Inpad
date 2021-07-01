import React, { useCallback, MouseEvent } from 'react'
import cc from 'classcat'
import styled from '../../../../shared/lib/styled'
import Spinner from '../../../../shared/components/atoms/Spinner'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import NavigatorSpaceSelector from './NavigatorSpaceSelector'
import NavigatorTree from './NavigatorTree'
import Icon from '../../../../shared/components/atoms/Icon'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import { usePreferences } from '../../../lib/preferences'
import {
  mdiSortAlphabeticalAscending,
  mdiSortAlphabeticalDescending,
  mdiSortClockAscendingOutline,
} from '@mdi/js'
import {
  useContextMenu,
  MenuTypes,
} from '../../../../shared/lib/stores/contextMenu'
import { NavigatorCategory } from '../../../lib/sidebar/useNavigatorTree'

type NavigatorProps = {
  sidebarExpandedWidth?: number
  sidebarResize?: (width: number) => void
  className?: string
  tree?: NavigatorCategory[]
  treeTopRows?: React.ReactNode
  currentTeam?: SerializedTeam
}

const Navigator = ({
  currentTeam,
  tree,
  treeTopRows,
  className,
}: NavigatorProps) => {
  const {
    globalData: { teams, invites },
  } = useGlobalData()
  const { preferences, setPreferences } = usePreferences()
  const { popup } = useContextMenu()

  const popupTreeSortingOrder = useCallback(
    (event: MouseEvent) => {
      popup(event, [
        {
          type: MenuTypes.Normal,
          label: (
            <>
              <Icon path={mdiSortAlphabeticalAscending} /> Title A-Z
            </>
          ),
          active: preferences.navigatorTreeSortingOrder === 'a-z',
          onClick: () => {
            setPreferences({
              navigatorTreeSortingOrder: 'a-z',
            })
          },
        },
        {
          type: MenuTypes.Normal,
          label: (
            <>
              <Icon path={mdiSortAlphabeticalDescending} /> Title Z-A
            </>
          ),
          active: preferences.navigatorTreeSortingOrder === 'z-a',
          onClick: () => {
            setPreferences({
              navigatorTreeSortingOrder: 'z-a',
            })
          },
        },
        {
          type: MenuTypes.Normal,
          label: (
            <>
              <Icon path={mdiSortAlphabeticalAscending} /> Last Updated
            </>
          ),
          active: preferences.navigatorTreeSortingOrder === 'last-updated',
          onClick: () => {
            setPreferences({
              navigatorTreeSortingOrder: 'last-updated',
            })
          },
        },
      ])
    },
    [popup, preferences.navigatorTreeSortingOrder, setPreferences]
  )

  return (
    <Container className={cc(['sidebar', className])}>
      <div className='sidebar__header'>
        <NavigatorSpaceSelector
          currentTeam={currentTeam}
          teams={teams}
          invites={invites}
        />
        <button
          className='sidebar__header__button'
          onClick={popupTreeSortingOrder}
        >
          <Icon
            path={
              preferences.navigatorTreeSortingOrder === 'a-z'
                ? mdiSortAlphabeticalAscending
                : preferences.navigatorTreeSortingOrder === 'z-a'
                ? mdiSortAlphabeticalDescending
                : mdiSortClockAscendingOutline
            }
          />
        </button>
      </div>

      <div className='sidebar__body'>
        {tree == null ? (
          <Spinner className='sidebar__loader' />
        ) : (
          <NavigatorTree tree={tree} topRows={treeTopRows} />
        )}
      </div>
    </Container>
  )
}

export default Navigator

const Container = styled.div`
  .sidebar {
    position: relative;
  }
  .sidebar__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 30px;
    display: flex;
    border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
  .sidebar__header__button {
    width: 30px;
    height: 100%;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.variants.secondary.text};
    border: none;
  }
  .sidebar__body {
    position: absolute;
    top: 30px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    overflow-x: hidden;
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }

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
