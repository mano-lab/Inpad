import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { NoteStorage } from '../../lib/db/types'
import NoteDetail from '../organisms/NoteDetail'
import {
  StorageNotesRouteParams,
  StorageTagsRouteParams,
  StorageTrashCanRouteParams,
  useRouteParams,
} from '../../lib/routeParams'
import { useGeneralStatus } from '../../lib/generalStatus'
import { useDb } from '../../lib/db'
import FolderDetail from '../organisms/FolderDetail'
import { useRouter } from '../../lib/router'
import { filenamify, parseNumberStringOrReturnZero } from '../../lib/string'
import { useTranslation } from 'react-i18next'
import { usePreferences } from '../../lib/preferences'
import { usePreviewStyle } from '../../lib/preview'
import { mapTopBarTree } from '../../lib/v2/mappers/local/topbarTree'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import {
  addIpcListener,
  getPathByName,
  removeIpcListener,
  showSaveDialog,
  openPath,
} from '../../lib/electronOnly'
import path from 'path'
import pathParse from 'path-parse'
import {
  exportNoteAsHtmlFile,
  exportNoteAsMarkdownFile,
  exportNoteAsPdfFile,
} from '../../lib/exports'
import {
  mdiChevronLeft,
  mdiChevronRight,
  mdiEyeOutline,
  mdiPencil,
  mdiViewSplitVertical,
} from '@mdi/js'
import { mapTopbarBreadcrumbs } from '../../lib/v2/mappers/local/topbarBreadcrumbs'
import {
  TopbarProps,
  TopbarControlButtonProps,
} from '../../shared/components/organisms/Topbar'
import NoteContextView from '../organisms/NoteContextView'
import Application from '../Application'
import { useToast } from '../../shared/lib/stores/toast'
import { useSidebarSearch } from '../../lib/search/stores/store'

interface WikiNotePageProps {
  storage: NoteStorage
}

const WikiNotePage = ({ storage }: WikiNotePageProps) => {
  const routeParams = useRouteParams() as
    | StorageNotesRouteParams
    | StorageTrashCanRouteParams
    | StorageTagsRouteParams

  const { hash } = useRouter()
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { noteViewMode, preferredEditingViewMode } = generalStatus

  const { t } = useTranslation()
  const { bookmarkNote, unbookmarkNote } = useDb()
  const { preferences } = usePreferences()

  const { previewStyle } = usePreviewStyle()

  const { pushMessage } = useToast()
  const storageId = storage.id
  const { updateNote, addAttachments } = useDb()
  const { push, goBack, goForward } = useRouter()
  const { addVisitedToHistory } = useSidebarSearch()

  const note = useMemo(() => {
    switch (routeParams.name) {
      case 'workspaces.notes': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null) {
          return undefined
        }
        if (!note.folderPathname.includes(routeParams.folderPathname)) {
          return undefined
        }
        return note
      }
      case 'workspaces.labels.show': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null) {
          return undefined
        }
        if (!note.tags.includes(routeParams.tagName)) {
          return undefined
        }
        return note
      }
      case 'workspaces.archive': {
        if (routeParams.noteId == null) {
          return undefined
        }
        const note = storage.noteMap[routeParams.noteId]
        if (note == null || !note.trashed) {
          return undefined
        }
        return note
      }
    }
    return undefined
  }, [routeParams, storage.noteMap])
  const noteId = note?._id

  const [previousNoteId, setPreviousNoteId] = useState<string | undefined>(
    noteId
  )

  const topbarTree = useMemo(() => {
    return mapTopBarTree(storage.noteMap, storage.folderMap, storage, push)
  }, [push, storage])
  const {
    openWorkspaceEditForm,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    deleteFolder,
    deleteOrTrashNote,
  } = useLocalUI()

  const bookmark = useCallback(async () => {
    if (noteId == null) {
      return
    }
    await bookmarkNote(storageId, noteId)
  }, [storageId, noteId, bookmarkNote])

  const unBookmark = useCallback(async () => {
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
              onClick: () => {
                if (result.filePath) {
                  openPath(result.filePath)
                }
              },
              type: 'success',
              title: 'HTML export',
              description: 'HTML file exported successfully.',
            })
            return
          case '.pdf':
            await exportNoteAsPdfFile(
              result.filePath,
              note,
              preferences['markdown.codeBlockTheme'],
              preferences['general.theme'],
              pushMessage,
              storage.attachmentMap,
              preferences['export.printOptions'],
              previewStyle
            )
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
              onClick: () => {
                if (result.filePath) {
                  openPath(result.filePath)
                }
              },
              type: 'success',
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

  const toggleBookmark = useCallback(async () => {
    if (note == null) {
      return
    }
    if (note.data.bookmarked) {
      await unBookmark()
    } else {
      await bookmark()
    }
  }, [note, unBookmark, bookmark])

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

  const folderPathname =
    note == null
      ? routeParams.name === 'workspaces.notes'
        ? routeParams.folderPathname
        : '/'
      : note.folderPathname

  const noteFolderOrFolder = useMemo(() => {
    if (note != null) {
      return storage.folderMap[note.folderPathname]
    } else if (routeParams.name === 'workspaces.notes') {
      return storage.folderMap[folderPathname]
    } else {
      return undefined
    }
  }, [folderPathname, note, routeParams.name, storage.folderMap])

  const topbar = useMemo(() => {
    const sharedControls = [
      {
        type: 'button',
        variant: 'icon' as const,
        iconPath: generalStatus.showingNoteContextMenu
          ? mdiChevronRight
          : mdiChevronLeft,
        tooltip: 'Open Context View',
        active: generalStatus.showingNoteContextMenu,
        onClick: () => toggleContextView(),
      },
    ] as TopbarControlButtonProps[]
    return {
      ...({
        breadcrumbs: mapTopbarBreadcrumbs(
          storage.folderMap,
          storage,
          push,
          { pageNote: note, pageFolder: noteFolderOrFolder },
          openRenameFolderForm,
          openRenameDocForm,
          openNewDocForm,
          openNewFolderForm,
          openWorkspaceEditForm,
          deleteOrTrashNote,
          (storageName, folder) =>
            deleteFolder({ workspaceName: storageName, folder }),
          undefined
        ),
      } as TopbarProps),
      tree: topbarTree,
      navigation: {
        goBack,
        goForward,
      },
      controls:
        note == null
          ? []
          : ([
              {
                type: 'button',
                variant: 'icon' as const,
                iconPath: mdiPencil,
                tooltip: t('note.edit'),
                active: noteViewMode === 'edit',
                onClick: () => selectEditMode(),
              },
              {
                type: 'button',
                variant: 'icon' as const,
                iconPath: mdiViewSplitVertical,
                tooltip: t('note.splitView'),
                active: noteViewMode === 'split',
                onClick: () => selectSplitMode(),
              },
              {
                type: 'button',
                variant: 'icon' as const,
                iconPath: mdiEyeOutline,
                tooltip: t('note.preview'),
                active: noteViewMode === 'preview',
                onClick: () => selectPreviewMode(),
              },
              ...sharedControls,
            ] as TopbarControlButtonProps[]),
    }
  }, [
    deleteFolder,
    deleteOrTrashNote,
    generalStatus.showingNoteContextMenu,
    goBack,
    goForward,
    note,
    noteFolderOrFolder,
    noteViewMode,
    openNewDocForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    openWorkspaceEditForm,
    push,
    selectEditMode,
    selectPreviewMode,
    selectSplitMode,
    storage,
    t,
    toggleContextView,
    topbarTree,
  ])

  const getCurrentPositionFromRoute = useCallback(() => {
    if (!hash.startsWith('#L') || !generalStatus.focusOnEditorCursor) {
      return null
    } else {
      let focusLine = 0
      let focusColumn = 0
      const focusData = hash.substring(2).split(',')
      if (focusData.length == 2) {
        focusLine = parseNumberStringOrReturnZero(focusData[0])
        focusColumn = parseNumberStringOrReturnZero(focusData[1])
      } else if (focusData.length == 1) {
        focusLine = parseNumberStringOrReturnZero(focusData[0])
      }
      setGeneralStatus({
        focusOnEditorCursor: false,
      })
      return {
        line: focusLine,
        ch: focusColumn,
      }
    }
  }, [generalStatus.focusOnEditorCursor, hash, setGeneralStatus])

  useEffect(() => {
    if (noteId != null && note != null && noteId != previousNoteId) {
      addVisitedToHistory(note)
      setPreviousNoteId(noteId)
    }
  }, [addVisitedToHistory, note, noteId, previousNoteId, setPreviousNoteId])

  return (
    <Application
      content={{
        topbar: topbar,
        right:
          note != null && generalStatus.showingNoteContextMenu ? (
            <NoteContextView storage={storage} note={note} />
          ) : undefined,
      }}
    >
      {note == null ? (
        routeParams.name === 'workspaces.notes' ? (
          <FolderDetail
            storage={storage}
            folderPathname={routeParams.folderPathname}
          />
        ) : (
          <div>Idle</div>
        )
      ) : (
        <NoteDetail
          note={note}
          storage={storage}
          updateNote={updateNote}
          addAttachments={addAttachments}
          viewMode={noteViewMode}
          initialCursorPosition={getCurrentPositionFromRoute()}
        />
      )}
    </Application>
  )
}

export default WikiNotePage
