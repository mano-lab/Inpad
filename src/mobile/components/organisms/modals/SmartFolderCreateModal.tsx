import React, { useState, useCallback } from 'react'
import { useModal } from '../../../../shared/lib/stores/modal'
import {
  createSmartFolder,
  CreateSmartFolderRequestBody,
} from '../../../../cloud/api/teams/smart-folder'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { useToast } from '../../../../shared/lib/stores/toast'
import { getSmartFolderHref } from '../../../../cloud/lib/href'
import { useRouter } from '../../../../cloud/lib/router'
import ModalContainer from './atoms/ModalContainer'
import SmartFolderForm from './organisms/SmartFolderForm'
import { useAppStatus } from '../../../lib/appStatus'

const SmartFolderCreateModal = () => {
  const { closeLastModal: closeModal } = useModal()
  const { team } = usePage()
  const { updateSmartFoldersMap } = useNav()
  const [sending, setSending] = useState(false)
  const { push } = useRouter()
  const { setShowingNavigator } = useAppStatus()

  const { pushApiErrorMessage } = useToast()
  const submit = useCallback(
    async (body: CreateSmartFolderRequestBody) => {
      if (team == null) {
        return
      }
      setSending(true)
      try {
        const { smartFolder } = await createSmartFolder(team, body)
        updateSmartFoldersMap([smartFolder.id, smartFolder])
        closeModal()
        setShowingNavigator(false)
        push(getSmartFolderHref(smartFolder, team, 'index'))
      } catch (error) {
        console.error(error)
        pushApiErrorMessage(error)
        setSending(false)
      }
    },
    [
      team,
      push,
      updateSmartFoldersMap,
      closeModal,
      pushApiErrorMessage,
      setShowingNavigator,
    ]
  )

  if (team == null) {
    return null
  }

  return (
    <ModalContainer title='Create a smart folder'>
      <SmartFolderForm
        action='Create'
        onSubmit={submit}
        defaultConditionType='and'
        buttonsAreDisabled={sending}
        isPersonalTeam={team.personal}
        defaultSecondaryConditions={[
          {
            type: 'status',
            value: 'in_progress',
          },
        ]}
      />
    </ModalContainer>
  )
}

export default SmartFolderCreateModal
