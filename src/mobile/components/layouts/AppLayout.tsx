import React from 'react'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'
import {
  mdiMenu,
  mdiClockOutline,
  mdiMagnify,
  mdiSquareEditOutline,
} from '@mdi/js'
import cc from 'classcat'
import { useToggle } from 'react-use'
import Navigator from '../organisms/Navigator'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useCloudSidebarTree } from '../../../cloud/lib/hooks/sidebar/useCloudSidebarTree'
import { useRouter } from '../../../cloud/lib/router'

interface AppLayoutProps {
  title?: React.ReactNode
}

const AppLayout: React.FC<AppLayoutProps> = ({ children, title }) => {
  const [showingNav, toggleShowingNav] = useToggle(
    true
    // false
  )
  const { treeWithOrderedCategories } = useCloudSidebarTree()
  const { push } = useRouter()

  const {
    team,
    permissions = [],
    currentUserPermissions,
    subscription,
    currentUserIsCoreMember,
  } = usePage()
  const {
    globalData: { teams, invites, currentUser },
    initialized,
  } = useGlobalData()

  return (
    <Container className={cc([showingNav && 'show-nav'])}>
      <div className='nav'>
        <Navigator
          currentTeam={team}
          teams={teams}
          invites={invites}
          tree={treeWithOrderedCategories}
        />
      </div>
      <div className='main'>
        <div className='main__header'>
          <button onClick={toggleShowingNav}>
            <Icon path={mdiMenu} />
          </button>
          {title}
        </div>

        <div className='main__body'>{children}</div>
        <div className='main__footer'>
          <button
            onClick={() => {
              push(`/${team!.domain}/timeline`)
            }}
          >
            <Icon path={mdiClockOutline} />
          </button>
          <button>
            <Icon path={mdiMagnify} />
          </button>
          <button>
            <Icon path={mdiSquareEditOutline} />
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
    position: absolute;
    left: -240px;
    width: 240px;
    bottom: 0;
    top: 0;
    transition: left 200ms ease-in-out;
  }
  .main {
    position: absolute;
    left: 0;
    height: 100%;
    width: 100%;
    transition: left 200ms ease-in-out;
  }
  .main__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 40px;
  }

  .main__body {
    position: absolute;
    top: 40px;
    left: 0;
    right: 0;
    bottom: 40px;
    overflow: auto;
  }

  .main__footer {
    position: absolute;
    height: 40px;
    left: 0;
    right: 0;
    bottom: 0;
  }

  &.show-nav {
    .nav {
      left: 0;
    }
    .main {
      left: 240px;
    }
  }
`
