import React, {
  useMemo,
  useCallback,
  MouseEventHandler,
  useEffect,
} from 'react'
import { useGeneralStatus } from '../../lib/generalStatus'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { useDb } from '../../lib/db'
import { useRouter } from '../../lib/router'
import { useTranslation } from 'react-i18next'
import { useToast } from '../../lib/toast'
import { useFirstUser, usePreferences } from '../../lib/preferences'
import NavigatorItem from '../atoms/NavigatorItem'
import { NoteStorage } from '../../lib/db/types'
import {
  mdiTrashCanOutline,
  mdiPaperclip,
  mdiBookOpen,
  mdiSync,
  mdiTextBoxPlusOutline,
  mdiFolderMultiplePlusOutline,
} from '@mdi/js'
import FolderNavigatorFragment from './FolderNavigatorFragment'
import TagListFragment from './TagListFragment'
import NavigatorButton from '../atoms/NavigatorButton'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { useAnalytics, analyticsEvents } from '../../lib/analytics'
import { MenuItemConstructorOptions } from 'electron'
import {
  openContextMenu,
  addIpcListener,
  removeIpcListener,
} from '../../lib/electronOnly'
import FolderNoteNavigatorFragment from './FolderNoteNavigatorFragment'
import { getFolderItemId } from '../../lib/nav'
import { useRouteParams } from '../../lib/routeParams'

interface StorageNavigatorFragmentProps {
  storage: NoteStorage
}

const StorageNavigatorFragment = ({
  storage,
}: StorageNavigatorFragmentProps) => {
  const {
    openSideNavFolderItemRecursively,
    sideNavOpenedItemSet,
    toggleSideNavOpenedItem,
  } = useGeneralStatus()
  const { prompt, messageBox } = useDialog()
  const {
    createNote,
    createFolder,
    renameFolder,
    renameStorage,
    removeStorage,
    syncStorage,
    bookmarkNote,
    unbookmarkNote,
    trashNote,
  } = useDb()
  const { push } = useRouter()
  const { t } = useTranslation()
  const { pushMessage } = useToast()
  const routeParams = useRouteParams()
  const user = useFirstUser()
  const { report } = useAnalytics()
  const { preferences } = usePreferences()
  const storageId = storage.id

  const createNoteInFolderAndRedirect = useCallback(
    async (folderPathname: string) => {
      report(analyticsEvents.createNote)
      const note = await createNote(storage.id, {
        folderPathname,
      })
      if (note == null) {
        return
      }
      push(
        `/app/storages/${storage.id}/notes${
          folderPathname === '/' ? '' : folderPathname
        }/${note._id}`
      )
      noteDetailFocusTitleInputEventEmitter.dispatch()
    },
    [storage.id, createNote, push, report]
  )

  const showPromptToCreateFolder = useCallback(
    (folderPathname: string) => {
      prompt({
        title: 'Create a Folder',
        message: 'Enter the path where do you want to create a folder',
        iconType: DialogIconTypes.Question,
        defaultValue: folderPathname === '/' ? '/' : `${folderPathname}/`,
        submitButtonLabel: 'Create Folder',
        onClose: async (value: string | null) => {
          if (value == null) {
            return
          }
          if (value.endsWith('/')) {
            value = value.slice(0, value.length - 1)
          }
          await createFolder(storage.id, value)

          push(`/app/storages/${storage.id}/notes${value}`)

          openSideNavFolderItemRecursively(storage.id, value)
          report(analyticsEvents.createFolder)
        },
      })
    },
    [
      storage.id,
      prompt,
      createFolder,
      push,
      openSideNavFolderItemRecursively,
      report,
    ]
  )

  useEffect(() => {
    const handler = () => {
      const folderPathname =
        routeParams.name === 'storages.notes' ? routeParams.folderPathname : '/'
      showPromptToCreateFolder(folderPathname)
    }
    addIpcListener('new-folder', handler)
    return () => {
      removeIpcListener('new-folder', handler)
    }
  }, [storageId, routeParams, showPromptToCreateFolder])

  const showPromptToRenameFolder = (folderPathname: string) => {
    prompt({
      title: t('folder.rename'),
      message: t('folder.renameMessage'),
      iconType: DialogIconTypes.Question,
      defaultValue: folderPathname.split('/').pop(),
      submitButtonLabel: t('folder.rename'),
      onClose: async (value: string | null) => {
        const folderPathSplit = folderPathname.split('/')
        if (value == null || value === '' || value === folderPathSplit.pop()) {
          return
        }
        const newPathname = folderPathSplit.join('/') + '/' + value
        await renameFolder(storage.id, folderPathname, newPathname)
        push(`/app/storages/${storage.id}/notes${newPathname}`)
        openSideNavFolderItemRecursively(storage.id, newPathname)
      },
    })
  }

  const sync = useCallback(() => {
    if (user == null) {
      pushMessage({
        title: 'No User Error',
        description: 'Please login first to sync the storage.',
      })
      return
    }
    syncStorage(storage.id)
  }, [user, storage.id, pushMessage, syncStorage])

  const generalAppMode = preferences['general.appMode']

  const rootFolderNavId = getFolderItemId(storage.id, '/')
  const rootFolderIsOpened = sideNavOpenedItemSet.has(rootFolderNavId)

  const rootFolderPathname = `/app/storages/${storage.id}/notes`
  const rootFolderIsActive =
    routeParams.name === 'storages.notes' &&
    routeParams.folderPathname === '/' &&
    (generalAppMode === 'note' || routeParams.noteId == null)

  const trashcanPagePathname = `/app/storages/${storage.id}/trashcan`
  const trashcanPageIsActive = routeParams.name === 'storages.trashCan'

  const attachmentsPagePathname = `/app/storages/${storage.id}/attachments`
  const attachmentsPageIsActive = routeParams.name === 'storages.attachments'

  const createNewNoteInRootFolder = useCallback(() => {
    createNoteInFolderAndRedirect('/')
  }, [createNoteInFolderAndRedirect])

  const createNewFolderInRootFolder = useCallback(() => {
    showPromptToCreateFolder('/')
  }, [showPromptToCreateFolder])

  const openWorkspaceContextMenu: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      const contentMenuItems: MenuItemConstructorOptions[] = [
        {
          type: 'normal',
          label: 'New Note',
          click: createNewNoteInRootFolder,
        },
        {
          type: 'normal',
          label: t('folder.create'),
          click: createNewFolderInRootFolder,
        },
      ]

      const storageMenuItems: MenuItemConstructorOptions[] = [
        {
          type: 'normal',
          label: t('storage.rename'),
          click: async () => {
            prompt({
              title: `Rename "${storage.name}" storage`,
              message: t('storage.renameMessage'),
              iconType: DialogIconTypes.Question,
              defaultValue: storage.name,
              submitButtonLabel: t('storage.rename'),
              onClose: async (value: string | null) => {
                if (value == null) return
                renameStorage(storage.id, value)
              },
            })
          },
        },
        {
          type: 'normal',
          label: t('storage.remove'),
          click: async () => {
            messageBox({
              title: `Remove "${storage.name}" storage`,
              message:
                storage.type === 'fs'
                  ? "This operation won't delete the actual storage folder. You can add it to the app again."
                  : t('storage.removeMessage'),
              iconType: DialogIconTypes.Warning,
              buttons: [t('storage.remove'), t('general.cancel')],
              defaultButtonIndex: 0,
              cancelButtonIndex: 1,
              onClose: (value: number | null) => {
                if (value === 0) {
                  removeStorage(storage.id)
                }
              },
            })
          },
        },
        {
          type: 'normal',
          label: 'Configure Storage',
          click: () => push(`/app/storages/${storage.id}/settings`),
        },
      ]
      if (storage.type !== 'fs' && storage.cloudStorage != null) {
        storageMenuItems.unshift({
          type: 'normal',
          label: 'Sync Storage',
          click: sync,
        })
      }

      const menuItems: MenuItemConstructorOptions[] = [
        ...contentMenuItems,
        {
          type: 'separator',
        },
        ...storageMenuItems,
      ]
      openContextMenu({ menuItems })
    },
    [
      storage,
      prompt,
      messageBox,
      createNewNoteInRootFolder,
      createNewFolderInRootFolder,
      sync,
      t,
      push,
      renameStorage,
      removeStorage,
    ]
  )

  const attachments = useMemo(() => Object.values(storage.attachmentMap), [
    storage.attachmentMap,
  ])
  const trashed = useMemo(
    () => Object.values(storage.noteMap).filter((note) => note!.trashed),
    [storage.noteMap]
  )

  const syncing = storage.type !== 'fs' && storage.sync != null

  const folded = useMemo(() => {
    return !sideNavOpenedItemSet.has(rootFolderNavId)
  }, [sideNavOpenedItemSet, rootFolderNavId])

  return (
    <>
      <NavigatorItem
        depth={0}
        iconPath={mdiBookOpen}
        label='Workspace'
        active={rootFolderIsActive}
        onClick={() => push(rootFolderPathname)}
        onContextMenu={openWorkspaceContextMenu}
        folded={folded}
        visibleControl={true}
        onFoldButtonClick={() => {
          toggleSideNavOpenedItem(rootFolderNavId)
        }}
        control={
          <>
            <NavigatorButton
              onClick={createNewNoteInRootFolder}
              iconPath={mdiTextBoxPlusOutline}
              title='New Note'
            />
            <NavigatorButton
              onClick={createNewFolderInRootFolder}
              iconPath={mdiFolderMultiplePlusOutline}
              title='New Folder'
            />

            {storage.type !== 'fs' && storage.cloudStorage != null && (
              <NavigatorButton
                active={syncing}
                onClick={sync}
                iconPath={mdiSync}
                spin={syncing}
              />
            )}
          </>
        }
      />
      {rootFolderIsOpened &&
        (generalAppMode === 'note' ? (
          <FolderNavigatorFragment
            storage={storage}
            createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
            showPromptToCreateFolder={showPromptToCreateFolder}
            showPromptToRenameFolder={showPromptToRenameFolder}
          />
        ) : (
          <FolderNoteNavigatorFragment
            storage={storage}
            createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
            showPromptToCreateFolder={showPromptToCreateFolder}
            showPromptToRenameFolder={showPromptToRenameFolder}
            bookmarkNote={bookmarkNote}
            unbookmarkNote={unbookmarkNote}
            trashNote={trashNote}
          />
        ))}

      <TagListFragment storage={storage} />
      {attachments.length > 0 && (
        <NavigatorItem
          depth={0}
          label={t('general.attachments')}
          iconPath={mdiPaperclip}
          active={attachmentsPageIsActive}
          count={attachments.length}
          onClick={() => push(attachmentsPagePathname)}
          onContextMenu={(event) => {
            event.preventDefault()
          }}
        />
      )}
      {trashed.length > 0 && (
        <NavigatorItem
          depth={0}
          label={t('general.trash')}
          iconPath={mdiTrashCanOutline}
          active={trashcanPageIsActive}
          count={trashed.length}
          onClick={() => push(trashcanPagePathname)}
          onContextMenu={(event) => {
            event.preventDefault()
            // TODO: Implement context menu(restore all notes)
          }}
        />
      )}
    </>
  )
}

export default StorageNavigatorFragment
