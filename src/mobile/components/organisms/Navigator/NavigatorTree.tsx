import React, { useCallback } from 'react'
import { FoldingProps } from '../../../../shared/components/atoms/FoldingWrapper'
import { MenuItem } from '../../../../shared/lib/stores/contextMenu'
import NavigatorCategory from './NavigatorCategory'
import styled from '../../../../shared/lib/styled'
import { mdiAccountMultiplePlusOutline, mdiCogOutline } from '@mdi/js'
import NavigatorControlItem from './NavigatorControlItem'
import {
  NavigatorRow,
  NavigatorControl,
} from '../../../lib/sidebar/useNavigatorTree'
import { useModal } from '../../../../shared/lib/stores/modal'
import SettingsModal from '../modals/SettingsModal'

interface NavigatorTreeProps {
  tree: {
    label: string
    folded: boolean
    controls?: NavigatorControl[]
    hidden: boolean
    toggleHidden: () => void
    folding?: FoldingProps
    rows: NavigatorRow[]
    contextControls?: MenuItem[]
    footer?: React.ReactNode
    lastCategory?: boolean
  }[]
  topRows?: React.ReactNode
}

const NavigatorTree = ({ tree, topRows }: NavigatorTreeProps) => {
  const { openModal } = useModal()

  const openAddMembersModal = useCallback(() => {
    openModal(<SettingsModal initialTab='space-members' />)
  }, [openModal])

  const openSettingsModal = useCallback(() => {
    openModal(<SettingsModal />)
  }, [openModal])

  return (
    <Container className='sidebar__tree'>
      {topRows != null && (
        <div className='sidebar__tree__rows--top'>{topRows}</div>
      )}

      {tree.map((category, i) => {
        if (category.hidden) {
          return null
        }

        return (
          <NavigatorCategory
            category={{
              ...category,
              lastCategory: i === tree.length - 1,
            }}
            key={`sidebar__category__${i}`}
          />
        )
      })}
      <NavigatorControlItem
        iconPath={mdiAccountMultiplePlusOutline}
        label='Add Members'
        onClick={openAddMembersModal}
      />
      <NavigatorControlItem
        iconPath={mdiCogOutline}
        label='Settings'
        onClick={openSettingsModal}
      />
    </Container>
  )
}

export default NavigatorTree

const Container = styled.div`
  height: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  display: flex;
  flex-direction: column;

  .sidebar__tree__viewbtn {
    width: 24px;
  }

  .sidebar__tree__wrapper {
    height: 100%;
    overflow: hidden;
    display: flex;
    flex-direction: column;
  }

  .sidebar__tree__scroller {
    padding: ${({ theme }) => theme.sizes.spaces.sm}px 0
      ${({ theme }) => theme.sizes.spaces.md}px 0;
    flex: 1 1 auto;
  }

  .sidebar__category {
    flex: 0 0 auto;
  }

  .sidebar__category__wrapper + .sidebar__category__wrapper {
    margin-top: ${({ theme }) => theme.sizes.spaces.sm}px;
  }

  .sidebar__category__items {
  }

  .sidebar__category__items--silenced .sidebar__tree__item {
    opacity: 0.4;
  }

  .sidebar__drag__zone__wrapper {
    position: relative;
  }

  .sidebar__drag__zone {
    &.sidebar__drag__zone--dragged-over {
      background-color: rgba(47, 111, 151, 0.6) !important;

      .sidebar__tree__item {
        background: none !important;
      }
    }
  }

  .sidebar__category:not(.sidebar__category--last):not(.sidebar__category--open) {
    border-bottom-color: ${({ theme }) => theme.colors.border.main} !important;
  }

  .sidebar__category__wrapper--open + .sidebar__category__wrapper {
    .sidebar__category {
      border-top-color: ${({ theme }) => theme.colors.border.main} !important;
    }
  }

  .sidebar__drag__zone__border {
    height: 16px;
    width: 100%;
    position: absolute;
    top: -8px;
    z-index: 20;

    &::after {
      content: '';
      height: 2px;
      background: none;
      width: 100%;
      display: block;
      position: relative;
      top: 7px;
    }

    &.sidebar__drag__zone__border--active::after {
      background-color: rgba(47, 111, 151, 0.6) !important;
    }
  }
`
