import React, { useMemo } from 'react'
import { useDb } from '../../lib/db'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { useContextMenu, MenuTypes } from '../../lib/contextMenu'
import NavigatorItem from '../atoms/NavigatorItem'
import { NoteStorage } from '../../lib/db/types'
import { usePathnameWithoutNoteId, useRouter } from '../../lib/router'
import { useGeneralStatus } from '../../lib/generalStatus'
import { getFolderItemId } from '../../lib/nav'
import { getTransferrableNoteData } from '../../lib/dnd'
import { useTranslation } from 'react-i18next'
import { mdiFolderOpen, mdiFolder, mdiDotsVertical } from '@mdi/js'
import NavigatorButton from '../atoms/NavigatorButton'
import { dispatchNoteDetailFocusTitleInputEvent } from '../../lib/events'

interface FolderListFragmentProps {
  storage: NoteStorage
  showPromptToCreateFolder: (folderPathname: string) => void
  showPromptToRenameFolder: (folderPathname: string) => void
}

const FolderListFragment = ({
  storage,
  showPromptToCreateFolder,
  showPromptToRenameFolder,
}: FolderListFragmentProps) => {
  const {
    removeFolder,
    updateNote,
    createNote,
    moveNoteToOtherStorage,
  } = useDb()
  const { push } = useRouter()
  const { messageBox } = useDialog()
  const { popup } = useContextMenu()
  const { t } = useTranslation()

  const { folderMap, id: storageId } = storage

  const { toggleSideNavOpenedItem, sideNavOpenedItemSet } = useGeneralStatus()

  const currentPathnameWithoutNoteId = usePathnameWithoutNoteId()

  const folderPathnames = useMemo(() => {
    return Object.keys(folderMap)
      .map((key) => {
        return {
          pathname: folderMap[key]!.pathname,
          order: folderMap[key]!.order,
        }
      })
      .sort((a, b) => {
        const aOrder = a.order === undefined ? 0 : a.order!
        const bOrder = b.order === undefined ? 0 : b.order!
        if (aOrder === bOrder) {
          return a.pathname.localeCompare(b.pathname)
        } else {
          return aOrder - bOrder
        }
      })
      .map((folder) => folder.pathname)
  }, [folderMap])

  const createOnFolderItemClickHandler = (folderPathname: string) => {
    return () => {
      push(
        `/app/storages/${storage.id}/notes${
          folderPathname === '/' ? '' : folderPathname
        }`
      )
    }
  }

  const createOnContextMenuHandler = (
    storageId: string,
    folderPathname: string
  ) => {
    return (event: React.MouseEvent) => {
      event.preventDefault()
      popup(event, [
        {
          type: MenuTypes.Normal,
          label: 'New Note',
          onClick: async () => {
            const note = await createNote(storage.id, {
              folderPathname,
            })
            push(
              `/app/storages/${storage.id}/notes${folderPathname}/${note!._id}`
            )
            dispatchNoteDetailFocusTitleInputEvent()
          },
        },
        {
          type: MenuTypes.Separator,
        },
        {
          type: MenuTypes.Normal,
          label: t('folder.create'),
          onClick: async () => {
            showPromptToCreateFolder(folderPathname)
          },
        },
        {
          type: MenuTypes.Normal,
          label: t('folder.rename'),
          enabled: folderPathname !== '/',
          onClick: async () => {
            showPromptToRenameFolder(folderPathname)
          },
        },
        {
          type: MenuTypes.Normal,
          label: t('folder.remove'),
          enabled: folderPathname !== '/',
          onClick: () => {
            messageBox({
              title: `Remove "${folderPathname}" folder`,
              message: t('folder.removeMessage'),
              iconType: DialogIconTypes.Warning,
              buttons: [t('folder.remove'), t('general.cancel')],
              defaultButtonIndex: 0,
              cancelButtonIndex: 1,
              onClose: (value: number | null) => {
                if (value === 0) {
                  removeFolder(storageId, folderPathname)
                }
              },
            })
          },
        },
      ])
    }
  }

  const folderSetWithSubFolders = useMemo(() => {
    return folderPathnames.reduce((folderSet, folderPathname) => {
      if (folderPathname !== '/') {
        const nameElements = folderPathname.slice(1).split('/')
        const parentFolderPathname =
          '/' + nameElements.slice(0, nameElements.length - 1).join('/')
        folderSet.add(parentFolderPathname)
      }
      return folderSet
    }, new Set())
  }, [folderPathnames])

  const openedFolderPathnameList = useMemo(() => {
    const tree = getFolderNameElementTree(folderPathnames)
    return getOpenedFolderPathnameList(
      tree,
      storageId,
      sideNavOpenedItemSet,
      '/'
    )
  }, [folderPathnames, storageId, sideNavOpenedItemSet])

  const createDropHandler = (folderPathname: string) => {
    return async (event: React.DragEvent) => {
      const transferrableNoteData = getTransferrableNoteData(event)
      if (transferrableNoteData == null) {
        return
      }

      const {
        storageId: originalNoteStorageId,
        note: originalNote,
      } = transferrableNoteData

      if (storageId === originalNoteStorageId) {
        await updateNote(storageId, originalNote._id, {
          folderPathname,
        })
      } else {
        messageBox({
          title: t('storage.moveTitle'),
          message: t('storage.moveMessage'),
          iconType: DialogIconTypes.Info,
          buttons: [t('storage.move'), t('storage.copy'), t('general.cancel')],
          defaultButtonIndex: 0,
          cancelButtonIndex: 2,
          onClose: async (value: number | null) => {
            switch (value) {
              case 0:
                await moveNoteToOtherStorage(
                  originalNoteStorageId,
                  originalNote._id,
                  storageId,
                  folderPathname
                )
                return
              case 1:
                await createNote(storageId, {
                  title: originalNote.title,
                  content: originalNote.content,
                  folderPathname,
                  tags: originalNote.tags,
                  data: originalNote.data,
                })
                return
            }
          },
        })
      }
    }
  }

  return (
    <>
      {openedFolderPathnameList.map((folderPathname: string) => {
        const nameElements = folderPathname.split('/').slice(1)
        const folderName = nameElements[nameElements.length - 1]
        const itemId = getFolderItemId(storageId, folderPathname)
        const depth = nameElements.length - 1
        const folded = folderSetWithSubFolders.has(folderPathname)
          ? !sideNavOpenedItemSet.has(itemId)
          : undefined

        const folderIsActive =
          currentPathnameWithoutNoteId ===
          `/app/storages/${storageId}/notes${folderPathname}`
        return (
          <NavigatorItem
            key={itemId}
            folded={folded}
            depth={depth}
            active={folderIsActive}
            iconPath={folderIsActive ? mdiFolderOpen : mdiFolder}
            label={folderName}
            onClick={createOnFolderItemClickHandler(folderPathname)}
            onDoubleClick={() => showPromptToRenameFolder(folderPathname)}
            onContextMenu={createOnContextMenuHandler(
              storage.id,
              folderPathname
            )}
            onFoldButtonClick={() => toggleSideNavOpenedItem(itemId)}
            control={
              <NavigatorButton
                onClick={createOnContextMenuHandler(storage.id, folderPathname)}
                iconPath={mdiDotsVertical}
              />
            }
            onDragOver={(event) => {
              event.preventDefault()
            }}
            onDrop={createDropHandler(folderPathname)}
          />
        )
      })}
    </>
  )
}

function getFolderNameElementTree(folderPathnameList: string[]) {
  return folderPathnameList.reduce((tree, folderPathname) => {
    const nameElements = folderPathname.slice(1).split('/')

    let targetTree = tree
    for (const nameElement of nameElements) {
      if (targetTree[nameElement] == null) {
        targetTree[nameElement] = {}
      }
      targetTree = targetTree[nameElement]
    }

    return tree
  }, {})
}

function getOpenedFolderPathnameList(
  tree: {},
  storageId: string,
  openItemIdSet: Set<string>,
  parentPathname: string
) {
  const names = Object.keys(tree)
  const pathnameList: string[] = []
  for (const name of names) {
    const pathname =
      parentPathname === '/' ? `/${name}` : `${parentPathname}/${name}`
    if (pathname === '/') {
      continue
    }
    pathnameList.push(pathname)
    if (openItemIdSet.has(getFolderItemId(storageId, pathname))) {
      pathnameList.push(
        ...getOpenedFolderPathnameList(
          tree[name],
          storageId,
          openItemIdSet,
          pathname
        )
      )
    }
  }
  return pathnameList
}

export default FolderListFragment
