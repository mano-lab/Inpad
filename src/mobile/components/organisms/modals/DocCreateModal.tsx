import React from 'react'
import ModalContainer from './atoms/ModalContainer'
import EmojiInputForm from '../../../../shared/components/organisms/EmojiInputForm'
import { mdiFileDocumentOutline } from '@mdi/js'
import { useI18n } from '../../../../cloud/lib/hooks/useI18n'
import { lngKeys } from '../../../../cloud/lib/i18n/types'
import { useModal } from '../../../../shared/lib/stores/modal'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { useCloudApi } from '../../../../cloud/lib/hooks/useCloudApi'

const DocCreateModal = () => {
  const { team } = usePage()
  const { currentWorkspaceId, currentParentFolderId } = useNav()
  const { closeLastModal } = useModal()
  const { createDoc } = useCloudApi()
  const { translate } = useI18n()
  return (
    <ModalContainer title='New Document'>
      <EmojiInputForm
        defaultIcon={mdiFileDocumentOutline}
        placeholder={translate(lngKeys.DocTitlePlaceholder)}
        submitButtonProps={{
          label: translate(lngKeys.GeneralCreate),
        }}
        onSubmit={async (inputValue: string, emoji?: string) => {
          if (team == null || currentWorkspaceId == null) {
            return
          }

          await createDoc(team, {
            workspaceId: currentWorkspaceId,
            parentFolderId: currentParentFolderId,
            title: inputValue,
            emoji,
          })
          closeLastModal()
        }}
      />
    </ModalContainer>
  )
}

export default DocCreateModal
