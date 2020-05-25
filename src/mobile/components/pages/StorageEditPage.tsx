import React, { useCallback, useState, useEffect, useRef } from 'react'
import { useDb } from '../../lib/db'
import { NoteStorage } from '../../../lib/db/types'
import { useRouter } from '../../lib/router'
import { useDialog, DialogIconTypes } from '../../../lib/dialog'
import { useToast } from '../../../lib/toast'
import { useTranslation } from 'react-i18next'
import TopBarLayout from '../layouts/TopBarLayout'
import TopBarToggleNavButton from '../atoms/TopBarToggleNavButton'
import {
  FormGroup,
  FormLabel,
  FormTextInput,
  FormHeading,
  FormPrimaryButton,
  FormBlockquote,
  FormSecondaryButton,
} from '../../../components/atoms/form'
import LinkCloudStorageForm from '../organisms/LinkCloudStorageForm'
import ManageCloudStorageForm from '../organisms/ManageCloudStorageForm'
import PageContainer from '../../../components/atoms/PageContainer'
import FolderList from '../../../components/organisms/FolderList/FolderList'
import {
  getFolderTreeData,
  isDuplicateFolderPathname,
  getUpdateFolderTreeInfo,
  FolderTree,
} from '../../../lib/folderTree'
import { values } from '../../../lib/db/utils'
import _ from 'lodash'
import TouchBackend from 'react-dnd-touch-backend'
import { useFolderRearrangement } from '../../../lib/folderRearrangement'

interface StorageEditPageProps {
  storage: NoteStorage
}

const StorageEditPage = ({ storage }: StorageEditPageProps) => {
  const db = useDb()
  const router = useRouter()
  const { t } = useTranslation()
  const [name, setName] = useState(storage.name)
  const { messageBox } = useDialog()
  const { pushMessage } = useToast()
  const {
    isRearranging,
    startRearrangement,
    endRearrangement,
  } = useFolderRearrangement()

  function usePrevious(value: any) {
    const ref = useRef()
    useEffect(() => {
      ref.current = value
    })
    return ref.current
  }

  const removeCallback = useCallback(() => {
    messageBox({
      title: `Remove "${storage.name}" storage`,
      message: t('storage.removeMessage'),
      iconType: DialogIconTypes.Warning,
      buttons: [t('storage.remove'), t('general.cancel')],
      defaultButtonIndex: 0,
      cancelButtonIndex: 1,
      onClose: async (value: number | null) => {
        if (value === 0) {
          try {
            await db.removeStorage(storage.id)
            router.push('/app')
          } catch {
            pushMessage({
              title: t('general.networkError'),
              description: `An error occurred while deleting storage (id: ${storage.id})`,
            })
          }
        }
      },
    })
  }, [storage, t, db, router, messageBox, pushMessage])

  const updateStorageName = useCallback(() => {
    db.renameStorage(storage.id, name)
  }, [storage.id, db, name])

  const [folderTreeDataState, setFolderTreeDataState] = useState(
    getFolderTreeData(values(storage.folderMap))
  )
  const prevFolderTreeState = usePrevious(folderTreeDataState)

  useEffect(() => {
    if (folderTreeDataState === prevFolderTreeState) {
      const newStorage = db.storageMap[storage.id]
      if (newStorage != undefined) {
        setFolderTreeDataState(getFolderTreeData(values(newStorage.folderMap)))
      }
    }
  }, [folderTreeDataState, prevFolderTreeState, db.storageMap, storage.id])

  const updateFolderTreeData = (treeData: FolderTree[]) => {
    if (!isDuplicateFolderPathname(treeData)) {
      setFolderTreeDataState(treeData)
    }
  }

  const rearrangeFolders = useCallback(async () => {
    startRearrangement()
    const updateFolderTreeInfo = await getUpdateFolderTreeInfo(
      folderTreeDataState
    )
    for (const aUpdateFolderTreeInfo of updateFolderTreeInfo) {
      if (_.isEmpty(aUpdateFolderTreeInfo.newPathname)) {
        await db.reorderFolder(
          storage.id,
          aUpdateFolderTreeInfo.oldPathname,
          aUpdateFolderTreeInfo.order
        )
      } else {
        if (!_.isEmpty(aUpdateFolderTreeInfo.swapTargetPathname)) {
          await db.renameFolder(
            storage.id,
            aUpdateFolderTreeInfo.newPathname,
            aUpdateFolderTreeInfo.swapTargetPathname,
            false,
            aUpdateFolderTreeInfo.order
          )
        }
        await db.renameFolder(
          storage.id,
          aUpdateFolderTreeInfo.oldPathname,
          aUpdateFolderTreeInfo.newPathname,
          false,
          aUpdateFolderTreeInfo.order
        )
      }
    }
    endRearrangement()
  }, [
    db,
    endRearrangement,
    folderTreeDataState,
    startRearrangement,
    storage.id,
  ])

  return (
    <TopBarLayout
      leftControl={<TopBarToggleNavButton />}
      titleLabel={t('storage.edit')}
    >
      <PageContainer>
        <FormGroup>
          <FormLabel>{t('storage.name')}</FormLabel>
          <FormTextInput
            type='text'
            value={name}
            onChange={(e: React.ChangeEvent<HTMLInputElement>) =>
              setName(e.target.value)
            }
          />
        </FormGroup>
        <FormGroup>
          <FormPrimaryButton onClick={updateStorageName}>
            Update storage name
          </FormPrimaryButton>
        </FormGroup>
        <hr />
        <FormHeading depth={2}>Folders</FormHeading>
        <FolderList
          backend={TouchBackend}
          folderTreeData={folderTreeDataState}
          handleFolderTreeDataUpdated={updateFolderTreeData}
          isRearranging={isRearranging}
        ></FolderList>
        <FormGroup>
          <FormPrimaryButton onClick={rearrangeFolders}>
            Update folders
          </FormPrimaryButton>
        </FormGroup>
        <hr />
        <FormHeading depth={2}>Remove Storage</FormHeading>
        {storage.cloudStorage != null && (
          <FormBlockquote>
            Your cloud storage will not be deleted by clicking this button. To
            delete cloud storage too, check cloud storage info section.
          </FormBlockquote>
        )}
        <FormGroup>
          <FormSecondaryButton onClick={removeCallback}>
            Remove Storage
          </FormSecondaryButton>
        </FormGroup>
        <hr />

        <FormHeading depth={2}>Cloud Storage info</FormHeading>
        {storage.cloudStorage == null ? (
          <LinkCloudStorageForm storage={storage} />
        ) : (
          <ManageCloudStorageForm storage={storage} />
        )}
      </PageContainer>
    </TopBarLayout>
  )
}

export default StorageEditPage
