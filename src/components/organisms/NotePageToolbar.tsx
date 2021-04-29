import React, { useCallback, MouseEventHandler, useEffect } from 'react'
import styled from '../../lib/styled'
import { NoteDoc, NoteStorage } from '../../lib/db/types'
import {
  mdiViewSplitVertical,
  mdiStarOutline,
  mdiStar,
  mdiEye,
  mdiPencil,
  mdiChevronRight,
  mdiChevronLeft,
} from '@mdi/js'
import { borderBottom, flexCenter } from '../../lib/styled/styleFunctions'
import ToolbarIconButton from '../atoms/ToolbarIconButton'
import { useGeneralStatus } from '../../lib/generalStatus'
import NotePageToolbarNoteHeader from '../molecules/NotePageToolbarNoteHeader'
import {
  exportNoteAsHtmlFile,
  exportNoteAsMarkdownFile,
  convertNoteDocToPdfBuffer,
} from '../../lib/exports'
import { usePreferences } from '../../lib/preferences'
import { usePreviewStyle } from '../../lib/preview'
import { useTranslation } from 'react-i18next'
import { useDb } from '../../lib/db'
import { useRouteParams } from '../../lib/routeParams'
import { useToast } from '../../lib/toast'
import {
  openContextMenu,
  showSaveDialog,
  getPathByName,
  addIpcListener,
  removeIpcListener,
  writeFile,
} from '../../lib/electronOnly'
import NotePageToolbarFolderHeader from '../molecules/NotePageToolbarFolderHeader'
import path from 'path'
import pathParse from 'path-parse'
import { filenamify } from '../../lib/string'

const Container = styled.div`
  display: flex;
  overflow: hidden;
  height: 44px;
  flex-shrink: 0;
  padding: 0 8px;
  ${borderBottom};
  align-items: center;
  & > .left {
    flex: 1;
    display: flex;
    align-items: center;
    overflow: hidden;
  }
`

const Control = styled.div`
  ${flexCenter}
`

interface NotePageToolbarProps {
  storage: NoteStorage
  note?: NoteDoc
}

const NotePageToolbar = ({ storage, note }: NotePageToolbarProps) => {
  const { t } = useTranslation()
  const { bookmarkNote, unbookmarkNote } = useDb()
  const { setPreferences, preferences } = usePreferences()

  const editorControlMode = preferences['editor.controlMode']

  const { previewStyle } = usePreviewStyle()
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { noteViewMode, preferredEditingViewMode } = generalStatus
  const { pushMessage } = useToast()

  const storageId = storage.id
  const storageName = storage.name

  const noteId = note?._id

  const bookmark = useCallback(async () => {
    if (noteId == null) {
      return
    }
    await bookmarkNote(storageId, noteId)
  }, [storageId, noteId, bookmarkNote])

  const unbookmark = useCallback(async () => {
    if (noteId == null) {
      return
    }
    await unbookmarkNote(storageId, noteId)
  }, [storageId, noteId, unbookmarkNote])

  const selectEditMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'edit',
      preferredEditingViewMode: 'edit',
    })
  }, [setGeneralStatus])

  const selectSplitMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'split',
      preferredEditingViewMode: 'split',
    })
  }, [setGeneralStatus])

  const selectPreviewMode = useCallback(() => {
    setGeneralStatus({
      noteViewMode: 'preview',
    })
  }, [setGeneralStatus])

  const togglePreviewMode = useCallback(() => {
    if (noteViewMode === 'preview') {
      if (preferredEditingViewMode === 'edit') {
        selectEditMode()
      } else {
        selectSplitMode()
      }
    } else {
      selectPreviewMode()
    }
  }, [
    noteViewMode,
    preferredEditingViewMode,
    selectEditMode,
    selectSplitMode,
    selectPreviewMode,
  ])

  useEffect(() => {
    addIpcListener('toggle-preview-mode', togglePreviewMode)
    return () => {
      removeIpcListener('toggle-preview-mode', togglePreviewMode)
    }
  }, [togglePreviewMode])

  const toggleSplitEditMode = useCallback(() => {
    if (noteViewMode === 'edit') {
      selectSplitMode()
    } else {
      selectEditMode()
    }
  }, [noteViewMode, selectSplitMode, selectEditMode])

  useEffect(() => {
    addIpcListener('toggle-split-edit-mode', toggleSplitEditMode)
    return () => {
      removeIpcListener('toggle-split-edit-mode', toggleSplitEditMode)
    }
  }, [toggleSplitEditMode])

  const includeFrontMatter = preferences['markdown.includeFrontMatter']

  useEffect(() => {
    const handler = () => {
      if (note == null) {
        return
      }
      showSaveDialog({
        properties: ['createDirectory', 'showOverwriteConfirmation'],
        buttonLabel: 'Save',
        defaultPath: path.join(
          getPathByName('home'),
          filenamify(note.title) + '.md'
        ),
        filters: [
          {
            name: 'Markdown',
            extensions: ['md'],
          },
          {
            name: 'HTML',
            extensions: ['html'],
          },
          {
            name: 'PDF',
            extensions: ['pdf'],
          },
        ],
      }).then(async (result) => {
        if (result.canceled || result.filePath == null) {
          return
        }
        const parsedFilePath = pathParse(result.filePath)
        switch (parsedFilePath.ext) {
          case '.html':
            await exportNoteAsHtmlFile(
              parsedFilePath.dir,
              parsedFilePath.name,
              note,
              preferences['markdown.codeBlockTheme'],
              preferences['general.theme'],
              pushMessage,
              storage.attachmentMap,
              previewStyle
            )
            pushMessage({
              title: 'HTML export',
              description: 'HTML file exported successfully.',
            })
            return
          case '.pdf':
            try {
              const pdfBuffer = await convertNoteDocToPdfBuffer(
                note,
                preferences['markdown.codeBlockTheme'],
                preferences['general.theme'],
                pushMessage,
                storage.attachmentMap,
                previewStyle
              )
              await writeFile(result.filePath, pdfBuffer)
            } catch (error) {
              console.error(error)
              pushMessage({
                title: 'PDF export failed',
                description: error.message,
              })
            }
            return
          case '.md':
          default:
            await exportNoteAsMarkdownFile(
              parsedFilePath.dir,
              parsedFilePath.name,
              note,
              storage.attachmentMap,
              includeFrontMatter
            )
            pushMessage({
              title: 'Markdown export',
              description: 'Markdown file exported successfully.',
            })
            return
        }
      })
    }
    addIpcListener('save-as', handler)
    return () => {
      removeIpcListener('save-as', handler)
    }
  }, [
    note,
    includeFrontMatter,
    preferences,
    previewStyle,
    pushMessage,
    storage.attachmentMap,
  ])

  const routeParams = useRouteParams()
  const folderPathname =
    note == null
      ? routeParams.name === 'storages.notes'
        ? routeParams.folderPathname
        : '/'
      : note.folderPathname

  const openTopbarSwitchSelectorContextMenu: MouseEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      event.preventDefault()
      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: 'Use 2 toggles layout',
            click: () => {
              setPreferences({
                'editor.controlMode': '2-toggles',
              })
            },
          },
          {
            type: 'normal',
            label: 'Use 3 buttons layout',
            click: () => {
              setPreferences({
                'editor.controlMode': '3-buttons',
              })
            },
          },
        ],
      })
    },
    [setPreferences]
  )

  const toggleBookmark = useCallback(() => {
    if (note == null) {
      return
    }
    if (note.data.bookmarked) {
      unbookmark()
    } else {
      bookmark()
    }
  }, [note, unbookmark, bookmark])

  useEffect(() => {
    addIpcListener('toggle-bookmark', toggleBookmark)
    return () => {
      removeIpcListener('toggle-bookmark', toggleBookmark)
    }
  })

  const toggleContextView = useCallback(() => {
    setGeneralStatus((previousGeneralStatus) => {
      return {
        showingNoteContextMenu: !previousGeneralStatus.showingNoteContextMenu,
      }
    })
  }, [setGeneralStatus])

  return (
    <Container>
      <div className='left'>
        {note == null ? (
          <NotePageToolbarFolderHeader
            storageId={storageId}
            folderPathname={folderPathname}
          />
        ) : (
          <NotePageToolbarNoteHeader
            storageId={storageId}
            storageName={storageName}
            noteId={note?._id}
            noteTitle={note?.title}
            noteFolderPathname={folderPathname}
          />
        )}
      </div>

      {note != null && (
        <Control onContextMenu={openTopbarSwitchSelectorContextMenu}>
          {editorControlMode === '3-buttons' ? (
            <>
              <ToolbarIconButton
                active={noteViewMode === 'edit'}
                title={t('note.edit')}
                onClick={selectEditMode}
                iconPath={mdiPencil}
              />
              <ToolbarIconButton
                active={noteViewMode === 'split'}
                title={t('note.splitView')}
                onClick={selectSplitMode}
                iconPath={mdiViewSplitVertical}
              />
              <ToolbarIconButton
                active={noteViewMode === 'preview'}
                title={t('note.preview')}
                onClick={selectPreviewMode}
                iconPath={mdiEye}
              />
            </>
          ) : (
            <>
              {noteViewMode !== 'preview' && (
                <ToolbarIconButton
                  active={noteViewMode === 'split'}
                  title='Toggle Split'
                  iconPath={mdiViewSplitVertical}
                  onClick={toggleSplitEditMode}
                />
              )}
              {noteViewMode !== 'preview' ? (
                <ToolbarIconButton
                  title={t('editor.showMarkdownPreview')}
                  iconPath={mdiEye}
                  onClick={selectPreviewMode}
                />
              ) : (
                <ToolbarIconButton
                  title={t('editor.showEditor')}
                  iconPath={mdiPencil}
                  onClick={selectEditMode}
                />
              )}
            </>
          )}
          <ToolbarIconButton
            active={!!note.data.bookmarked}
            title={t(`bookmark.${!note.data.bookmarked ? 'add' : 'remove'}`)}
            onClick={toggleBookmark}
            iconPath={note.data.bookmarked ? mdiStar : mdiStarOutline}
          />
          <ToolbarIconButton
            active={generalStatus.showingNoteContextMenu}
            title='Open Context View'
            onClick={toggleContextView}
            iconPath={
              generalStatus.showingNoteContextMenu
                ? mdiChevronRight
                : mdiChevronLeft
            }
          />
        </Control>
      )}
    </Container>
  )
}

export default NotePageToolbar
