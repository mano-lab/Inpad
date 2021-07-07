import React, { useCallback } from 'react'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'
import { mdiMenu, mdiMagnify, mdiSquareEditOutline } from '@mdi/js'
import cc from 'classcat'
import Navigator from '../organisms/Navigator'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useNavigatorTree } from '../../lib/sidebar/useNavigatorTree'
import { useAppStatus } from '../../lib/appStatus'
import NavigationBarContainer from '../atoms/NavigationBarContainer'
import NavigationBarButton from '../atoms/NavigationBarButton'
import { useModal } from '../../../shared/lib/stores/modal'
import MobileSearchModal from '../organisms/modals/MobileSearchModal'
import DocCreateModal from '../organisms/modals/DocCreateModal'

interface AppLayoutProps {
  title?: React.ReactNode
  navigatorBarRight?: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({
  children,
  title,
  navigatorBarRight,
}) => {
  const { showingNavigator, toggleShowingNavigator } = useAppStatus()
  const { treeWithOrderedCategories } = useNavigatorTree()

  const { team } = usePage()

  const { openModal } = useModal()
  const openSearchModal = useCallback(() => {
    openModal(<MobileSearchModal />)
  }, [openModal])

  const openDocCreateModal = useCallback(() => {
    openModal(<DocCreateModal />)
  }, [openModal])

  return (
    <Container className={cc([showingNavigator && 'show-nav'])}>
      <div className='nav'>
        <Navigator currentTeam={team} tree={treeWithOrderedCategories} />
      </div>
      <div className='main'>
        <div
          className={cc([
            'main__navigator-curtain',
            showingNavigator && 'main__navigator-curtain--show',
          ])}
          onClick={toggleShowingNavigator}
        />
        <div className='main__header'>
          <NavigationBarContainer
            label={title}
            left={
              <NavigationBarButton onClick={toggleShowingNavigator}>
                <Icon size={20} path={mdiMenu} />
              </NavigationBarButton>
            }
            right={navigatorBarRight}
          />
        </div>

        <div className='main__body'>{children}</div>
        <div className='main__footer'>
          <button className='main__footer__button' onClick={openSearchModal}>
            <Icon size={20} path={mdiMagnify} />
          </button>
          <div className='main__footer__spacer' />
          <button className='main__footer__button' onClick={openDocCreateModal}>
            <Icon size={20} path={mdiSquareEditOutline} />
          </button>
        </div>
      </div>
    </Container>
  )
}

export default AppLayout

const Container = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  width: 100%;
  height: 100%;
  overflow: hidden;
  .nav {
    position: fixed;
    left: -360px;
    width: 360px;
    bottom: 0;
    top: 0;
    transition: left 200ms ease-in-out;
  }
  .main {
    position: fixed;
    left: 0;
    height: 100%;
    width: 100%;
    transition: left 200ms ease-in-out;
  }
  .main__navigator-curtain {
    position: absolute;
    left: 0;
    right: 0;
    top: 0;
    bottom: 0;
    background-color: rgba(0, 0, 0, 0.6);
    z-index: 1;
    opacity: 0;
    display: none;
    transition: opacity 200ms ease-in-out;

    &.main__navigator-curtain--show {
      opacity: 1;
      display: block;
    }
  }
  .main__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
  }

  .main__body {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 48px;
    overflow: auto;
  }

  .main__footer {
    position: absolute;
    height: 48px;
    left: 0;
    right: 0;
    bottom: 0;
    display: flex;
    border-top: 1px solid ${({ theme }) => theme.colors.border.main};
  }
  .main__footer__spacer {
    flex: 1;
    height: 47px;
  }
  .main__footer__button {
    height: 47px;
    background-color: transparent;
    border: none;
    color: ${({ theme }) => theme.colors.text.primary};
    padding: 0 ${({ theme }) => theme.sizes.spaces.sm}px;
    flex: 1;
  }

  &.show-nav {
    .nav {
      left: 0;
    }
    .main {
      left: 360px;
    }
  }
`
