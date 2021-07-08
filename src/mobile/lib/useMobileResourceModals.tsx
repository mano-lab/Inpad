import React, { useCallback } from 'react'
import { mdiFileDocumentOutline, mdiFolderOutline } from '@mdi/js'
import { FormRowProps } from '../../shared/components/molecules/Form/templates/FormRow'
import { DialogIconTypes, useDialog } from '../../shared/lib/stores/dialog'
import { useModal } from '../../shared/lib/stores/modal'
import { SubmissionWrappers } from '../../shared/lib/types'
import { SerializedDoc } from '../../cloud/interfaces/db/doc'
import { SerializedFolder } from '../../cloud/interfaces/db/folder'
import { SerializedTeam } from '../../cloud/interfaces/db/team'
import { SerializedWorkspace } from '../../cloud/interfaces/db/workspace'
import { useI18n } from '../../cloud/lib/hooks/useI18n'
import { lngKeys } from '../../cloud/lib/i18n/types'
import { useCloudApi } from '../../cloud/lib/hooks/useCloudApi'
import MobileResourceModal from '../components/organisms/modals/MobileResourceModal'
import MobileWorkspaceModal from '../components/organisms/modals/MobileWorkspaceModal'

export function useMobileResourceModals() {
  const { openModal, closeLastModal } = useModal()
  const { messageBox } = useDialog()
  const {
    updateFolder,
    updateDoc,
    createFolder,
    createDoc,
    deleteWorkspaceApi,
    deleteFolderApi,
    deleteDocApi,
  } = useCloudApi()
  const { translate } = useI18n()

  const openWorkspaceCreateForm = useCallback(() => {
    openModal(
      <MobileWorkspaceModal
        title={translate(lngKeys.ModalsWorkspaceCreateTitle)}
      />
    )
  }, [openModal, translate])

  const openWorkspaceEditForm = useCallback(
    (wp: SerializedWorkspace) => {
      openModal(
        <MobileWorkspaceModal
          title={translate(lngKeys.ModalsWorkspaceEditTitle)}
          workspace={wp}
        />
      )
    },
    [openModal, translate]
  )

  const openRenameFolderForm = useCallback(
    (folder: SerializedFolder) => {
      openModal(
        <MobileResourceModal
          title={translate(lngKeys.RenameFolder)}
          defaultIcon={mdiFolderOutline}
          defaultInputValue={folder.name}
          defaultEmoji={folder.emoji}
          placeholder={translate(lngKeys.FolderNamePlaceholder)}
          submitButtonProps={{
            label: translate(lngKeys.GeneralUpdateVerb),
          }}
          onSubmit={async (inputValue: string, emoji?: string) => {
            await updateFolder(folder, {
              workspaceId: folder.workspaceId,
              parentFolderId: folder.parentFolderId,
              folderName: inputValue,
              emoji,
            })
            closeLastModal()
          }}
        />
      )
    },
    [openModal, closeLastModal, updateFolder, translate]
  )

  const openRenameDocForm = useCallback(
    (doc: SerializedDoc) => {
      openModal(
        <MobileResourceModal
          title={translate(lngKeys.RenameDoc)}
          defaultIcon={mdiFileDocumentOutline}
          defaultInputValue={doc.title}
          defaultEmoji={doc.emoji}
          placeholder={translate(lngKeys.DocTitlePlaceholder)}
          submitButtonProps={{
            label: translate(lngKeys.GeneralUpdateVerb),
          }}
          onSubmit={async (inputValue: string, emoji?: string) => {
            await updateDoc(doc, {
              workspaceId: doc.workspaceId,
              parentFolderId: doc.parentFolderId,
              title: inputValue,
              emoji: emoji == null ? null : emoji,
            })
            closeLastModal()
          }}
        />
      )
    },
    [openModal, closeLastModal, updateDoc, translate]
  )

  const openNewFolderForm = useCallback(
    (
      body: CloudNewResourceRequestBody,
      options?: UIFormOptions & { skipRedirect?: boolean }
    ) => {
      openModal(
        <MobileResourceModal
          title={translate(lngKeys.ModalsCreateNewFolder)}
          defaultIcon={mdiFolderOutline}
          placeholder={translate(lngKeys.FolderNamePlaceholder)}
          submitButtonProps={{
            label: translate(lngKeys.GeneralCreate),
          }}
          prevRows={options?.precedingRows}
          onSubmit={async (inputValue: string, emoji?: string) => {
            if (body.team == null || body.workspaceId == null) {
              return
            }

            if (options?.beforeSubmitting != null) {
              options.beforeSubmitting()
            }
            await createFolder(
              body.team,
              {
                workspaceId: body.workspaceId,
                parentFolderId: body.parentFolderId,
                folderName: inputValue,
                description: '',
                emoji,
              },
              {
                skipRedirect: options?.skipRedirect,
                afterSuccess: closeLastModal,
              }
            )
            if (options?.afterSubmitting != null) {
              options.afterSubmitting()
            }
          }}
        />
      )
    },
    [openModal, closeLastModal, createFolder, translate]
  )

  const openNewDocForm = useCallback(
    (
      body: CloudNewResourceRequestBody,
      options?: UIFormOptions & { skipRedirect?: boolean }
    ) => {
      openModal(
        <MobileResourceModal
          title={translate(lngKeys.ModalsCreateNewDocument)}
          defaultIcon={mdiFileDocumentOutline}
          placeholder={translate(lngKeys.DocTitlePlaceholder)}
          submitButtonProps={{
            label: translate(lngKeys.GeneralCreate),
          }}
          prevRows={options?.precedingRows}
          onSubmit={async (inputValue: string, emoji?: string) => {
            if (body.team == null || body.workspaceId == null) {
              return
            }

            if (options?.beforeSubmitting != null) {
              options.beforeSubmitting()
            }
            await createDoc(
              body.team,
              {
                workspaceId: body.workspaceId,
                parentFolderId: body.parentFolderId,
                title: inputValue,
                emoji,
              },
              {
                skipRedirect: options?.skipRedirect,
                afterSuccess: closeLastModal,
              }
            )
            if (options?.afterSubmitting != null) {
              options.afterSubmitting()
            }
          }}
        />
      )
    },
    [openModal, closeLastModal, createDoc, translate]
  )

  const deleteWorkspace = useCallback(
    async (workspace: { id: string; teamId: string; default: boolean }) => {
      if (workspace.default) {
        return
      }
      messageBox({
        title: translate(lngKeys.ModalsDeleteWorkspaceTitle),
        message: translate(lngKeys.ModalsDeleteWorkspaceDisclaimer),
        buttons: [
          {
            variant: 'secondary',
            label: translate(lngKeys.GeneralCancel),
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: 'danger',
            label: translate(lngKeys.GeneralDelete),
            onClick: async () => await deleteWorkspaceApi(workspace),
          },
        ],
      })
    },
    [messageBox, deleteWorkspaceApi, translate]
  )

  const deleteFolder = useCallback(
    async (target: { id: string; pathname: string; teamId: string }) => {
      messageBox({
        title: translate(lngKeys.ModalsDeleteDocFolderTitle, {
          label: target.pathname,
        }),
        message: translate(lngKeys.ModalsDeleteFolderDisclaimer),
        iconType: DialogIconTypes.Warning,
        buttons: [
          {
            variant: 'secondary',
            label: translate(lngKeys.GeneralCancel),
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: 'danger',
            label: translate(lngKeys.GeneralDelete),
            onClick: async () => {
              await deleteFolderApi(target)
            },
          },
        ],
      })
    },
    [messageBox, deleteFolderApi, translate]
  )

  const deleteDoc = useCallback(
    async (
      target: { id: string; archivedAt?: string; teamId: string },
      title = ''
    ) => {
      messageBox({
        title: translate(lngKeys.ModalsDeleteDocFolderTitle, { label: title }),
        message: translate(lngKeys.ModalsDeleteDocDisclaimer),
        iconType: DialogIconTypes.Warning,
        buttons: [
          {
            variant: 'secondary',
            label: translate(lngKeys.GeneralCancel),
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: 'danger',
            label: translate(lngKeys.GeneralDelete),
            onClick: async () => {
              await deleteDocApi(target)
            },
          },
        ],
      })
    },
    [messageBox, deleteDocApi, translate]
  )

  return {
    openWorkspaceCreateForm,
    openWorkspaceEditForm,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    deleteFolder,
    deleteWorkspace,
    deleteDoc,
  }
}

export interface CloudNewResourceRequestBody {
  team?: SerializedTeam
  workspaceId?: string
  parentFolderId?: string
}

export type UIFormOptions = SubmissionWrappers & {
  precedingRows: FormRowProps[]
}
