import React, { useState } from 'react'
import ModalContainer from './atoms/ModalContainer'
import TableItem from '../../atoms/TableItem'
import { mdiAccountCircleOutline, mdiDomain } from '@mdi/js'
import TableHeaderItem from '../../atoms/TableHeaderItem'
import AccountSettingsTab from './AccountSettingsTab'
import SpaceMembersTab from './SpaceMembersTab'
import SpaceSettingsTab from './SpaceSettingsTab'
import SpaceUpgradeTab from './SpaceUpgradeTab'
import SpaceUpgradeConfirmTab from './SpaceUpgradeConfirmTab'
import { SettingsTabTypes } from './types'
import SpaceBillingsTab from './SpaceBillingsTab'

interface SettingsModalProps {
  initialTab?: SettingsTabTypes | null
}

const SettingsModal = ({ initialTab = null }: SettingsModalProps) => {
  const [activeTab, setActiveTab] = useState<SettingsTabTypes | null>(
    initialTab
  )

  switch (activeTab) {
    case 'account-settings':
      return <AccountSettingsTab setActiveTab={setActiveTab} />
    case 'space-settings':
      return <SpaceSettingsTab setActiveTab={setActiveTab} />
    case 'space-members':
      return <SpaceMembersTab setActiveTab={setActiveTab} />
    case 'space-upgrade':
      return <SpaceUpgradeTab setActiveTab={setActiveTab} />
    case 'space-upgrade-confirm-free':
      return <SpaceUpgradeConfirmTab plan={null} setActiveTab={setActiveTab} />
    case 'space-upgrade-confirm-standard':
      return (
        <SpaceUpgradeConfirmTab plan='standard' setActiveTab={setActiveTab} />
      )
    case 'space-upgrade-confirm-pro':
      return <SpaceUpgradeConfirmTab plan='pro' setActiveTab={setActiveTab} />
    case 'space-billings':
      return <SpaceBillingsTab setActiveTab={setActiveTab} />
    default:
      return (
        <ModalContainer title='Settings' closeLabel='Done'>
          <TableHeaderItem label='Account' iconPath={mdiAccountCircleOutline} />
          <TableItem
            label='Settings'
            onClick={() => setActiveTab('account-settings')}
          />
          <TableHeaderItem label='Space' iconPath={mdiDomain} />
          <TableItem
            label='Settings'
            onClick={() => setActiveTab('space-settings')}
          />
          <TableItem
            label='Members'
            onClick={() => setActiveTab('space-members')}
          />
          <TableItem
            label='Upgrade'
            onClick={() => setActiveTab('space-upgrade')}
          />
          <TableItem
            label='Billings'
            onClick={() => setActiveTab('space-billings')}
          />
        </ModalContainer>
      )
  }
}

export default SettingsModal
