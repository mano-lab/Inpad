import React, { useMemo, useCallback } from 'react'
import styled from '../../lib/styled/styled'
import {
  borderBottom,
  uiTextColor,
  secondaryBackgroundColor,
  textOverflow,
  TagStyleProps,
} from '../../lib/styled/styleFunctions'
import cc from 'classcat'
import { setTransferrableNoteData } from '../../lib/dnd'
import { formatDistanceToNow } from 'date-fns'
import { scaleAndTransformFromLeft } from '../../lib/styled'
import { useDb } from '../../lib/db'
import { useDialog, DialogIconTypes } from '../../lib/dialog'
import { useTranslation } from 'react-i18next'
import { NoteDoc, PopulatedTagDoc } from '../../lib/db/types'
import { useRouter } from '../../lib/router'
import { GeneralNoteListViewOptions } from '../../lib/preferences'
import { useGeneralStatus } from '../../lib/generalStatus'
import { bookmarkItemId } from '../../lib/nav'
import { openContextMenu } from '../../lib/electronOnly'
import { BaseTheme } from '../../lib/styled/BaseTheme'
import { isColorBright } from '../../lib/colors'
import { useToast } from '../../lib/toast'

const Container = styled.button`
  margin: 0;
  border-left: 2px solid transparent;
  cursor: pointer;
  width: 100%;
  background-color: transparent;
  text-align: left;
  padding: 8px 10px 8px 8px;
  ${uiTextColor};

  border-color: transparent;
  border-style: solid;
  border-width: 0 0 0 2px;

  &.active,
  &:active,
  &:focus,
  &:hover {
    ${secondaryBackgroundColor}
  }
  &.active {
    border-left-color: ${({ theme }) => theme.primaryColor};
  }
  ${borderBottom};
  transition: 200ms background-color;

  &.new {
    position: relative;
    left: -200px;
    transform: scaleY(0.3);
    transform-origin: top left;
    animation: ${scaleAndTransformFromLeft} 0.2s linear forwards;
  }
`

const TitleSection = styled.div`
  font-size: 17px;
  font-weight: bold;
  width: 100%;
  ${textOverflow}
`

const DateSection = styled.div`
  font-size: 10px;
  margin-top: 5px;
  font-style: italic;
  ${textOverflow}
`

const PreviewSection = styled.div`
  margin-top: 6px;
  ${textOverflow}
`

const TagListSection = styled.div`
  margin-top: 6px;
  width: 100%;
  overflow: hidden;
  white-space: nowrap;
  display: flex;
`

const TagListItem = styled.div<BaseTheme & TagStyleProps>`
  height: 20px;
  padding: 0 8px;
  margin-right: 2px;
  border-radius: 10px;
  background-color: ${({ theme, color }) =>
    color || theme.secondaryBackgroundColor};

  font-size: 12px;
  line-height: 20px;
  ${textOverflow}
`

const TagItemAnchor = styled.button<BaseTheme & TagStyleProps>`
  background-color: transparent;
  border: none;
  text-decoration: none;
  color: #fff;
  filter: invert(
    ${({ theme, color }) =>
      isColorBright(color || theme.secondaryBackgroundColor) ? 100 : 0}%
  );
`

type NoteItemProps = {
  storageId: string
  note: NoteDoc
  noteTags: PopulatedTagDoc[]
  active: boolean
  recentlyCreated?: boolean
  basePathname: string
  focusList: () => void
  noteListView: GeneralNoteListViewOptions
  applyDefaultNoteListing: () => void
  applyCompactListing: () => void
}

const NoteItem = ({
  storageId,
  note,
  noteTags,
  active,
  basePathname,
  recentlyCreated,
  noteListView,
  applyDefaultNoteListing,
  applyCompactListing,
}: NoteItemProps) => {
  const href = `${basePathname}/${note._id}`
  const {
    createNote,
    copyNoteLink,
    trashNote,
    purgeNote,
    untrashNote,
    bookmarkNote,
    unbookmarkNote,
  } = useDb()
  const { push } = useRouter()
  const { addSideNavOpenedItem } = useGeneralStatus()

  const { messageBox } = useDialog()
  const { pushMessage } = useToast()
  const { t } = useTranslation()

  const openUntrashedNoteContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()

      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: 'Duplicate Note',
            click: async () => {
              createNote(storageId, {
                title: note.title,
                content: note.content,
                folderPathname: note.folderPathname,
                tags: note.tags,
                data: note.data,
              })
            },
          },
          {
            type: 'normal',
            label: 'Copy note link',
            click: async () => {
              const noteLink = await copyNoteLink(storageId, note._id, {
                title: note.title,
                content: note.content,
                folderPathname: note.folderPathname,
                tags: note.tags,
                data: note.data,
              })
              if (noteLink) {
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
            type: 'normal',
            label: 'Trash Note',
            click: async () => {
              if (note.trashed) {
                return
              }
              trashNote(storageId, note._id)
            },
          },
          { type: 'separator' },
          !note.data.bookmarked
            ? {
                type: 'normal',
                label: 'Bookmark',
                click: () => {
                  bookmarkNote(storageId, note._id)
                  addSideNavOpenedItem(bookmarkItemId)
                },
              }
            : {
                type: 'normal',
                label: 'Unbookmark',
                click: () => {
                  unbookmarkNote(storageId, note._id)
                },
              },
          { type: 'separator' },
          {
            type: 'normal',
            label: 'Default View',
            click: applyDefaultNoteListing,
          },
          {
            type: 'normal',
            label: 'Compact View',
            click: applyCompactListing,
          },
        ],
      })
    },
    [
      note.data,
      note.title,
      note.content,
      note.folderPathname,
      note.tags,
      note._id,
      note.trashed,
      applyDefaultNoteListing,
      applyCompactListing,
      createNote,
      storageId,
      copyNoteLink,
      pushMessage,
      trashNote,
      bookmarkNote,
      addSideNavOpenedItem,
      unbookmarkNote,
    ]
  )

  const openTrashedNoteContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.stopPropagation()
      event.preventDefault()

      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: 'Restore Note',
            click: async () => {
              await untrashNote(storageId, note._id)
            },
          },
          { type: 'separator' },
          {
            type: 'normal',
            label: 'Delete Note',
            click: async () => {
              messageBox({
                title: 'Delete Note',
                message: t('note.deleteMessage'),
                iconType: DialogIconTypes.Warning,
                buttons: [t('note.delete2'), t('general.cancel')],
                defaultButtonIndex: 0,
                cancelButtonIndex: 1,
                onClose: (value: number | null) => {
                  if (value === 0) {
                    purgeNote(storageId, note._id)
                  }
                },
              })
            },
          },
          { type: 'separator' },
          {
            type: 'normal',
            label: 'Default View',
            click: applyDefaultNoteListing,
          },
          {
            type: 'normal',
            label: 'Compact View',
            click: applyCompactListing,
          },
        ],
      })
    },
    [
      storageId,
      note._id,
      t,
      untrashNote,
      purgeNote,
      messageBox,
      applyDefaultNoteListing,
      applyCompactListing,
    ]
  )

  const contentPreview = useMemo(() => {
    const trimmedContent = note.content.trim()

    return trimmedContent.split('\n').shift() || t('note.empty')
  }, [note.content, t])

  const loadTransferrableNoteData = useCallback(
    (event: React.DragEvent) => {
      setTransferrableNoteData(event, storageId, note)
    },
    [storageId, note]
  )

  const navigateToNote = useCallback(() => {
    push(href)
  }, [push, href])

  return (
    <Container
      onContextMenu={
        note.trashed ? openTrashedNoteContextMenu : openUntrashedNoteContextMenu
      }
      className={cc([active && 'active', recentlyCreated && 'new'])}
      onDragStart={loadTransferrableNoteData}
      draggable={true}
      onClick={navigateToNote}
    >
      <TitleSection>
        {note.title.length === 0 ? t('note.noTitle') : note.title}
      </TitleSection>
      {noteListView !== 'compact' && (
        <>
          <DateSection>
            {formatDistanceToNow(new Date(note.updatedAt))} {t('note.date')}
          </DateSection>
          <PreviewSection>{contentPreview}</PreviewSection>
          {noteTags.length > 0 && (
            <TagListSection>
              {noteTags.map((tag) => (
                <TagListItem color={tag.data.color} key={tag.name}>
                  <TagItemAnchor color={tag.data.color}>
                    {tag.name}
                  </TagItemAnchor>
                </TagListItem>
              ))}
            </TagListSection>
          )}
        </>
      )}
    </Container>
  )
}

export default NoteItem
