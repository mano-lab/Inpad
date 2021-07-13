import React, { useState, useCallback, useMemo } from 'react'
import { SerializedFolderWithBookmark } from '../../../cloud/interfaces/db/folder'
import { SerializedTeam } from '../../../cloud/interfaces/db/team'
import ContentManagerRow from './ContentManagerRow'
import {
  mdiStar,
  mdiStarOutline,
  mdiFolderMoveOutline,
  mdiTrashCanOutline,
} from '@mdi/js'
import FolderLink from '../../../cloud/components/atoms/Link/FolderLink'
import ContentManagerRowLinkContent from './ContentManagerRowLinkContent'
import { useNav } from '../../../cloud/lib/stores/nav'
import {
  CreateFolderBookmarkResponseBody,
  DestroyFolderBookmarkResponseBody,
  destroyFolderBookmark,
  createFolderBookmark,
} from '../../../cloud/api/teams/folders/bookmarks'
import RowAction, {
  ContentManagerRowAction,
} from '../../../cloud/components/molecules/ContentManager/Actions/RowAction'
import Flexbox from '../../../cloud/components/atoms/Flexbox'
import { getFolderId } from '../../../cloud/lib/utils/patterns'
import { useToast } from '../../../shared/lib/stores/toast'
import { useModal } from '../../../shared/lib/stores/modal'
import MobileResourceMoveModal from '../organisms/modals/MobileResourceMoveModal'

interface ContentManagerFolderRowProps {
  team: SerializedTeam
  folder: SerializedFolderWithBookmark
  updating: boolean
  setUpdating: React.Dispatch<React.SetStateAction<string[]>>
  checked?: boolean
  onSelect: (val: boolean) => void
  currentUserIsCoreMember: boolean
}

enum ActionsIds {
  Bookmark = 0,
  Move = 1,
  Delete = 2,
}

const ContentmanagerFolderRow = ({
  team,
  folder,
  checked,
  updating,
  currentUserIsCoreMember,
  setUpdating,
  onSelect,
}: ContentManagerFolderRowProps) => {
  const [sending, setSending] = useState<ActionsIds>()
  const {
    updateFoldersMap,
    deleteFolderHandler,
    updateFolderHandler,
  } = useNav()
  const { pushMessage, pushApiErrorMessage } = useToast()
  const { openModal } = useModal()

  const toggleFolderBookmark = useCallback(
    async (folder: SerializedFolderWithBookmark) => {
      if (updating) {
        return
      }
      const patternedId = getFolderId(folder)
      setUpdating((prev) => [...prev, patternedId])
      setSending(ActionsIds.Bookmark)
      try {
        let data:
          | CreateFolderBookmarkResponseBody
          | DestroyFolderBookmarkResponseBody
        if (folder.bookmarked) {
          data = await destroyFolderBookmark(team.id, folder.id)
        } else {
          data = await createFolderBookmark(team.id, folder.id)
        }
        updateFoldersMap([data.folder.id, data.folder])
      } catch (error) {
        pushMessage({
          title: 'Error',
          description: 'Could not alter bookmark for this folder',
        })
      }
      setSending(undefined)
      setUpdating((prev) => prev.filter((id) => id !== patternedId))
    },
    [team, setSending, pushMessage, updateFoldersMap, updating, setUpdating]
  )

  const trashFolder = useCallback(
    async (folder: SerializedFolderWithBookmark) => {
      if (updating) {
        return
      }
      const patternedId = getFolderId(folder)
      setUpdating((prev) => [...prev, patternedId])
      setSending(ActionsIds.Delete)
      await deleteFolderHandler(folder)
      setSending(undefined)
      setUpdating((prev) => prev.filter((id) => id !== patternedId))
    },
    [deleteFolderHandler, updating, setUpdating]
  )

  const moveFolder = useCallback(
    async (
      folder: SerializedFolderWithBookmark,
      workspaceId: string,
      parentFolderId?: string
    ) => {
      if (updating) {
        return
      }
      const patternedId = getFolderId(folder)
      setUpdating((prev) => [...prev, patternedId])
      setSending(ActionsIds.Move)
      try {
        await updateFolderHandler(folder, {
          workspaceId,
          parentFolderId,
          emoji: 'unchanged',
        })
      } catch (error) {
        pushApiErrorMessage(error)
      }
      setSending(undefined)
      setUpdating((prev) => prev.filter((id) => id !== patternedId))
    },
    [updateFolderHandler, updating, setUpdating, pushApiErrorMessage]
  )

  const openMoveForm = useCallback(
    (folder: SerializedFolderWithBookmark) => {
      openModal(
        <MobileResourceMoveModal
          onSubmit={(workspaceId, parentFolderId) =>
            moveFolder(folder, workspaceId, parentFolderId)
          }
        />
      )
    },
    [openModal, moveFolder]
  )

  const actions = useMemo(() => {
    const actions: ContentManagerRowAction<SerializedFolderWithBookmark>[] = []

    actions.push(
      folder.bookmarked
        ? {
            iconPath: mdiStar,
            id: ActionsIds.Bookmark,
            tooltip: 'Unbookmark',
            onClick: () => toggleFolderBookmark(folder),
          }
        : {
            iconPath: mdiStarOutline,
            id: ActionsIds.Bookmark,
            tooltip: 'Bookmark',
            onClick: () => toggleFolderBookmark(folder),
          }
    )

    if (!currentUserIsCoreMember) {
      return actions
    }

    actions.push({
      iconPath: mdiFolderMoveOutline,
      id: ActionsIds.Move,
      tooltip: 'Move',
      onClick: () => openMoveForm(folder),
    })

    actions.push({
      iconPath: mdiTrashCanOutline,
      id: ActionsIds.Delete,
      tooltip: 'Delete',
      onClick: () => trashFolder(folder),
    })

    return actions
  }, [
    folder,
    toggleFolderBookmark,
    trashFolder,
    openMoveForm,
    currentUserIsCoreMember,
  ])

  return (
    <ContentManagerRow
      checked={checked}
      onSelect={onSelect}
      showCheckbox={currentUserIsCoreMember}
      itemLink={
        <FolderLink folder={folder} team={team} id={`cm-folder-${folder.id}`}>
          <ContentManagerRowLinkContent
            label={folder.name}
            emoji={folder.emoji}
            date={folder.updatedAt}
          />
        </FolderLink>
      }
      rowActions={
        <Flexbox flex='0 0 auto' className='actions'>
          {actions.map((action) => (
            <RowAction
              action={action}
              item={folder}
              key={`${action.id}`}
              sending={action.id === sending}
              disabled={updating}
            />
          ))}
        </Flexbox>
      }
    />
  )
}

export default ContentmanagerFolderRow
