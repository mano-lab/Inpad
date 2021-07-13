import React, { useState, useCallback } from 'react'
import { useModal } from '../../../../shared/lib/stores/modal'
import {
  updateSmartFolder,
  UpdateSmartFolderRequestBody,
} from '../../../../cloud/api/teams/smart-folder'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { useToast } from '../../../../shared/lib/stores/toast'
import { getSmartFolderHref } from '../../../../cloud/lib/href'
import { useRouter } from '../../../../cloud/lib/router'
import { SerializedSmartFolder } from '../../../../cloud/interfaces/db/smartFolder'
import SmartFolderForm from './organisms/SmartFolderForm'
import ModalContainer from './atoms/ModalContainer'

interface SmartFolderUpdateModalProps {
  smartFolder: SerializedSmartFolder
}

const SmartFolderUpdateModal = ({
  smartFolder,
}: SmartFolderUpdateModalProps) => {
  const { closeLastModal: closeModal } = useModal()
  const { team } = usePage()

  const { updateSmartFoldersMap } = useNav()
  const [sending, setSending] = useState(false)
  const { push } = useRouter()

  const { pushApiErrorMessage } = useToast()
  const submit = useCallback(
    async (body: UpdateSmartFolderRequestBody) => {
      if (team == null) {
        return
      }
      setSending(true)
      try {
        const { smartFolder: updatedSmartFolder } = await updateSmartFolder(
          team,
          smartFolder,
          body
        )
        updateSmartFoldersMap([smartFolder.id, updatedSmartFolder])
        closeModal()
        push(getSmartFolderHref(smartFolder, team, 'index'))
      } catch (error) {
        console.error(error)
        pushApiErrorMessage(error)
        setSending(false)
      }
    },
    [
      team,
      smartFolder,
      updateSmartFoldersMap,
      closeModal,
      push,
      pushApiErrorMessage,
    ]
  )

  if (team == null) {
    return null
  }

  return (
    <ModalContainer title='Edit a smart folder'>
      <SmartFolderForm
        action='Update'
        onSubmit={submit}
        buttonsAreDisabled={sending}
        isPersonalTeam={team.personal}
        defaultName={smartFolder.name}
        defaultPrivate={smartFolder.private}
        defaultConditionType={smartFolder.condition.type}
        defaultSecondaryConditions={smartFolder.condition.conditions.map(
          (secondaryCondition) => {
            switch (secondaryCondition.type) {
              case 'due_date':
              case 'creation_date':
              case 'update_date':
                switch (secondaryCondition.value.type) {
                  case '30_days':
                  case '7_days':
                  case 'today':
                    return {
                      type: secondaryCondition.type,
                      value: {
                        type: secondaryCondition.value.type,
                      },
                    }
                  case 'before':
                  case 'after':
                  case 'specific':
                    return {
                      type: secondaryCondition.type,
                      value: {
                        type: secondaryCondition.value.type,
                        date: new Date(secondaryCondition.value.date),
                      },
                    }
                  case 'between':
                    return {
                      type: secondaryCondition.type,
                      value: {
                        type: secondaryCondition.value.type,
                        from: new Date(secondaryCondition.value.from),
                        to: new Date(secondaryCondition.value.to),
                      },
                    }
                }
            }
            return secondaryCondition
          }
        )}
      />
    </ModalContainer>
  )
}

export default SmartFolderUpdateModal
