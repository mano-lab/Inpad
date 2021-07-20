import { useCallback, useRef } from 'react'
import { NavResource } from '../../interfaces/resources'
import { useToast } from '../../../../shared/lib/stores/toast'
import { NoteStorage } from '../../../db/types'
import { useLocalDB } from './useLocalDB'
import { getFolderName, getFolderPathname } from '../../../db/utils'
import { SidebarDragState } from '../../../../shared/lib/dnd'
import { getResourceId, getResourceParentPathname } from '../../../db/patterns'
import { join } from 'path'
import arrayMove from 'array-move'

export function useLocalDnd() {
  const draggedResource = useRef<NavResource>()
  const { pushApiErrorMessage } = useToast()
  const {
    updateDocApi,
    renameFolderApi,
    updateFolderOrderedIdsApi,
  } = useLocalDB()

  const moveInSameFolder = useCallback(
    async (
      workspaceId: string,
      sourceIndex: number,
      targetedIndex: number,
      orderedIds: string[],
      resourceId: string
    ) => {
      const rawOrderedIds = [...orderedIds]
      arrayMove.mutate(rawOrderedIds, sourceIndex, targetedIndex)
      await updateFolderOrderedIdsApi(resourceId, {
        workspaceId: workspaceId,
        orderedIds: rawOrderedIds,
      })
    },
    [updateFolderOrderedIdsApi]
  )

  const isMoveInsideSameFolder = useCallback(
    ({
      workspace,
      targetedResource,
      draggedResource,
      targetedPosition,
    }: {
      workspace: NoteStorage
      targetedResource: NavResource
      draggedResource: NavResource
      targetedPosition: SidebarDragState
    }) => {
      const targetParentFolder =
        workspace.folderMap[
          getResourceParentPathname(targetedResource, targetedPosition)
        ]
      const sourceParentFolder =
        workspace.folderMap[
          getResourceParentPathname(draggedResource, targetedPosition)
        ]
      const originalPath =
        sourceParentFolder != null ? sourceParentFolder.pathname : '/'
      const targetedPath =
        targetParentFolder != null ? targetParentFolder.pathname : '/'
      return targetedPath === originalPath
    },
    []
  )

  const updateFolderOrDocOrder = useCallback(
    async ({
      workspace,
      targetedResource,
      draggedResource,
      targetedPosition,
    }: {
      workspace: NoteStorage
      targetedResource: NavResource
      draggedResource: NavResource
      targetedPosition: SidebarDragState
    }) => {
      const originalResourceId = getResourceId(draggedResource)
      const targetParentFolder =
        workspace.folderMap[
          getResourceParentPathname(targetedResource, targetedPosition)
        ]
      // note on note (reorder them)
      const targetedPath =
        targetParentFolder != null ? targetParentFolder.pathname : '/'
      const isInterFolderMove = isMoveInsideSameFolder({
        workspace,
        targetedResource,
        draggedResource,
        targetedPosition,
      })
      const orderedIds: string[] | undefined =
        targetParentFolder != null
          ? targetParentFolder.orderedIds || []
          : undefined
      if (orderedIds == null) {
        console.warn(
          'Error during drag and drop, ordered IDs not initialized',
          orderedIds
        )
        throw new Error('The drag and drop transfer data is incorrect')
      }

      let sourceOriginalIndex = -1
      let targetOriginalIndex = -1
      let targetedPositionIndex = -1
      if (isInterFolderMove) {
        // check indexes
        sourceOriginalIndex = orderedIds.indexOf(originalResourceId)
        targetOriginalIndex = orderedIds.indexOf(
          getResourceId(targetedResource)
        )
      } else {
        // outer folder move - for now just add it to destination folder (DB updates ordered IDs
        await updateDocApi(originalResourceId, {
          workspaceId: workspace.id,
          docProps: {
            folderPathname: targetedPath,
          },
        })
        return
      }

      if (sourceOriginalIndex === -1 || targetOriginalIndex === -1) {
        // do nothing...
        console.warn(
          '[ERROR] - Doing nothing on move, source and targets were invalid',
          sourceOriginalIndex,
          targetOriginalIndex
        )
        return
      }

      const isMoveAfter = sourceOriginalIndex < targetOriginalIndex

      switch (targetedPosition) {
        case 0:
          throw new Error('The drag and drop transfer data is incorrect')
        case 1:
          // move after
          targetedPositionIndex = isMoveAfter
            ? targetOriginalIndex
            : targetOriginalIndex + 1
          break
        case -1:
          // move before
          targetedPositionIndex = isMoveAfter
            ? targetOriginalIndex - 1
            : targetOriginalIndex
          break
      }

      /* move onto itself, do nothing */
      if (isInterFolderMove && targetedPositionIndex === sourceOriginalIndex) {
        // do nothing
        console.log(
          '[ERROR] - target and source indexes are the same, ignoring Drag And Drop update'
        )
        return
      } else {
        const updateResourceId =
          targetParentFolder != null ? targetParentFolder._id : workspace.id
        if (isInterFolderMove) {
          await moveInSameFolder(
            workspace.id,
            sourceOriginalIndex,
            targetedPositionIndex,
            orderedIds,
            updateResourceId
          )
        }
      }
    },
    [isMoveInsideSameFolder, moveInSameFolder, updateDocApi]
  )

  const dropInDocOrFolder = useCallback(
    async (
      workspace: NoteStorage,
      targetedResource: NavResource,
      targetedPosition: SidebarDragState
    ) => {
      if (draggedResource.current == null || targetedPosition == null) {
        return
      }

      if (
        draggedResource.current.type === targetedResource.type &&
        draggedResource.current.result._id === targetedResource.result._id
      ) {
        return
      }

      try {
        const originalResourceId = getResourceId(draggedResource.current)
        if (draggedResource.current.type == 'doc') {
          const isInterFolderMove = isMoveInsideSameFolder({
            workspace,
            targetedResource,
            draggedResource: draggedResource.current,
            targetedPosition,
          })
          if (isInterFolderMove) {
            await updateFolderOrDocOrder({
              workspace,
              targetedResource,
              draggedResource: draggedResource.current,
              targetedPosition,
            })
          } else {
            const targetFolderPathname = getResourceParentPathname(
              targetedResource,
              targetedPosition
            )

            await updateDocApi(originalResourceId, {
              workspaceId: workspace.id,
              docProps: {
                folderPathname: targetFolderPathname,
              },
            })
          }
        } else {
          // move folder
          const isInterFolderMove = isMoveInsideSameFolder({
            workspace,
            targetedResource,
            draggedResource: draggedResource.current,
            targetedPosition,
          })
          if (isInterFolderMove) {
            await updateFolderOrDocOrder({
              workspace,
              targetedResource,
              draggedResource: draggedResource.current,
              targetedPosition,
            })
          } else {
            // move folder inside target folder
            const folderResource = draggedResource.current?.result
            const folderOriginalPathname = getFolderPathname(folderResource._id)
            const targetFolderPathname = getResourceParentPathname(
              targetedResource,
              targetedPosition
            )
            const newFolderPathname = join(
              targetFolderPathname,
              getFolderName(folderResource)
            )
            // database updates ordered IDs on folder renames
            await renameFolderApi(draggedResource.current?.result, {
              workspaceId: workspace.id,
              oldPathname: folderOriginalPathname,
              newPathname: newFolderPathname,
            })
          }
        }
      } catch (error) {
        console.warn('Error while doing drag and drop', error)
        pushApiErrorMessage(error)
      }
    },
    [
      isMoveInsideSameFolder,
      updateFolderOrDocOrder,
      updateDocApi,
      renameFolderApi,
      pushApiErrorMessage,
    ]
  )

  return {
    draggedResource,
    dropInDocOrFolder,
  }
}
