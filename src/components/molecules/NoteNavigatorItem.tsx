import React, { useCallback, MouseEventHandler } from 'react'
import NavigatorItem from '../atoms/NavigatorItem'
import { mdiCardTextOutline, mdiDotsVertical } from '@mdi/js'
import { useStorageRouter } from '../../lib/storageRouter'
import { NoteDoc, NoteDocEditibleProps } from '../../lib/db/types'
import NavigatorButton from '../atoms/NavigatorButton'
import { openContextMenu } from '../../lib/electronOnly'
import { useToast } from '../../lib/toast'
import copy from 'copy-to-clipboard'

interface NoteNavigatorItemProps {
  storageId: string
  noteId: string
  noteTitle: string
  noteFolderPath: string
  noteBookmarked: boolean
  active: boolean
  depth: number
  bookmarkNote: (
    storageId: string,
    noteId: string
  ) => Promise<NoteDoc | undefined>
  unbookmarkNote: (
    storageId: string,
    noteId: string
  ) => Promise<NoteDoc | undefined>
  trashNote: (storageId: string, noteId: string) => Promise<NoteDoc | undefined>
  copyNoteLink: (
    storageId: string,
    noteId: string,
    noteProps: Partial<NoteDocEditibleProps>
  ) => Promise<string | undefined>
}

const NoteNavigatorItem = ({
  storageId,
  noteId,
  noteTitle,
  noteFolderPath,
  active,
  depth,
  noteBookmarked,
  bookmarkNote,
  unbookmarkNote,
  trashNote,
  copyNoteLink,
}: NoteNavigatorItemProps) => {
  const emptyTitle = noteTitle.trim().length === 0
  const { navigateToNote } = useStorageRouter()
  const { pushMessage } = useToast()

  const navigate = useCallback(() => {
    navigateToNote(storageId, noteId, noteFolderPath)
  }, [navigateToNote, storageId, noteId, noteFolderPath])

  const openNoteContextMenu: MouseEventHandler = useCallback(
    (event) => {
      event.preventDefault()
      event.stopPropagation()
      openContextMenu({
        menuItems: [
          !noteBookmarked
            ? {
                label: 'Bookmark Note',
                click: () => {
                  bookmarkNote(storageId, noteId)
                },
              }
            : {
                label: 'Unbookmark Note',
                click: () => {
                  unbookmarkNote(storageId, noteId)
                },
              },
          { type: 'separator' },
          {
            type: 'normal',
            label: 'Copy note link',
            click: async () => {
              const noteLink = await copyNoteLink(storageId, noteId, {
                title: noteTitle,
                folderPathname: noteFolderPath,
              })
              if (noteLink) {
                copy(noteLink)
                pushMessage({
                  title: 'Note Link Copied',
                  description:
                    'Paste note link in any note to add a link to it',
                })
              } else {
                pushMessage({
                  title: 'Note Link Error',
                  description:
                    'An error occurred while attempting to create a note link',
                })
              }
            },
          },
          { type: 'separator' },
          {
            label: 'Trash Note',
            click: () => {
              trashNote(storageId, noteId)
            },
          },
        ],
      })
    },
    [
      noteBookmarked,
      bookmarkNote,
      storageId,
      noteId,
      unbookmarkNote,
      copyNoteLink,
      noteTitle,
      noteFolderPath,
      pushMessage,
      trashNote,
    ]
  )

  return (
    <NavigatorItem
      active={active}
      iconPath={mdiCardTextOutline}
      label={emptyTitle ? 'Untitled' : noteTitle}
      depth={depth}
      subtle={emptyTitle}
      onClick={navigate}
      onContextMenu={openNoteContextMenu}
      control={
        <NavigatorButton
          iconPath={mdiDotsVertical}
          onClick={openNoteContextMenu}
        />
      }
    />
  )
}

export default NoteNavigatorItem
