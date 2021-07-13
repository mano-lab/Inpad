import React, { useMemo } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { PageStoreWithTeam } from '../../../../cloud/interfaces/pageStore'
import TeamLink from '../../../../cloud/components/atoms/Link/TeamLink'
import SettingTabContent from '../../../../shared/components/organisms/Settings/atoms/SettingTabContent'
import ViewerRestrictedWrapper from '../../../../cloud/components/molecules/ViewerRestrictedWrapper'
import { useModal } from '../../../../shared/lib/stores/modal'
import { mdiArrowLeft } from '@mdi/js'
import ModalContainer from './atoms/ModalContainer'
import NavigationBarButton from '../../atoms/NavigationBarButton'
import Icon from '../../../../shared/components/atoms/Icon'
import { SettingsTabTypes } from './types'
import SettingsTeamForm from './organisms/SettingsTeamForm'

interface SpaceSettingsTabProps {
  setActiveTab: (tabType: SettingsTabTypes | null) => void
}

const SpaceSettingsTab = ({ setActiveTab }: SpaceSettingsTabProps) => {
  const { team, currentUserPermissions } = usePage<PageStoreWithTeam>()

  const { closeAllModals } = useModal()

  const adminContent = useMemo(() => {
    if (
      currentUserPermissions == null ||
      team == null ||
      currentUserPermissions.role !== 'admin'
    ) {
      return null
    }

    return (
      <section>
        <h2>Delete Space</h2>
        <p className='text--subtle'>
          Once you delete this space we will remove all associated data. There
          is no turning back.{' '}
          <TeamLink
            intent='delete'
            team={team}
            beforeNavigate={() => closeAllModals()}
          >
            Delete
          </TeamLink>
        </p>
      </section>
    )
  }, [currentUserPermissions, team, closeAllModals])

  if (team == null) {
    return null
  }

  return (
    <ModalContainer
      left={
        <NavigationBarButton onClick={() => setActiveTab(null)}>
          <Icon size={20} path={mdiArrowLeft} /> Back
        </NavigationBarButton>
      }
      title='Members'
      closeLabel='Done'
    >
      <SettingTabContent
        description={'Manage your space settings.'}
        body={
          <ViewerRestrictedWrapper>
            <section>
              <SettingsTeamForm team={team} teamConversion={false} />
            </section>
          </ViewerRestrictedWrapper>
        }
        footer={adminContent}
      ></SettingTabContent>
    </ModalContainer>
  )
}

export default SpaceSettingsTab
