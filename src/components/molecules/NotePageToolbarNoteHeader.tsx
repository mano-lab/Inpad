import React, {
  useMemo,
  useState,
  useCallback,
  KeyboardEvent,
  useRef,
  useEffect,
  MouseEventHandler,
  FocusEventHandler,
} from 'react'
import {
  mdiCardTextOutline,
  mdiFolderOutline,
  mdiPencilOutline,
  mdiBookOpen,
  mdiDotsHorizontal,
} from '@mdi/js'
import { useRouter } from '../../lib/router'
import ToolbarButton from '../atoms/ToolbarButton'
import ToolbarSlashSeparator from '../atoms/ToolbarSlashSeparator'
import { useDb } from '../../lib/db'
import styled from '../../lib/styled'
import {
  inputStyle,
  flexCenter,
  textOverflow,
  border,
} from '../../lib/styled/styleFunctions'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { isChildNode } from '../../lib/dom'
import Icon from '../atoms/Icon'
import cc from 'classcat'
import FolderTreeListItem from '../atoms/FolderTreeListItem'
import { addIpcListener, removeIpcListener } from '../../lib/electronOnly'
import Tooltip from '../atoms/Tooltip'
import { useTranslation } from 'react-i18next'

interface NotePageToolbarNoteHeaderProps {
  storageId: string
  storageName: string
  noteId: string
  noteFolderPathname: string
  noteTitle: string
}

interface FolderData {
  name: string
  pathname: string
}

const NotePageToolbarNoteHeader = ({
  storageId,
  noteId,
  noteFolderPathname,
  noteTitle,
}: NotePageToolbarNoteHeaderProps) => {
  const { push } = useRouter()
  const { updateNote } = useDb()
  const { t } = useTranslation()

  const folderDataList = useMemo<FolderData[]>(() => {
    if (noteFolderPathname === '/') {
      return []
    }
    const folderNames = noteFolderPathname.slice(1).split('/')
    let pathname = ''
    const folderDataList = []
    for (const folderName of folderNames) {
      pathname += '/' + folderName
      folderDataList.push({
        name: folderName,
        pathname,
      })
    }
    return folderDataList
  }, [noteFolderPathname])

  const navigateToWorkspace = useCallback(() => {
    push(`/app/storages/${storageId}/notes`)
  }, [push, storageId])

  const [editingTitle, setEditingTitle] = useState(false)
  const [newTitle, setNewTitle] = useState(noteTitle)
  const titleInputRef = useRef<HTMLInputElement>(null)
  const startEditingTitle = useCallback(() => {
    setNewTitle(noteTitle)
    setEditingTitle(true)
  }, [noteTitle])

  useEffect(() => {
    setNewTitle(noteTitle)
  }, [noteTitle])

  useEffect(() => {
    if (editingTitle && titleInputRef.current != null) {
      titleInputRef.current.focus()
    }
  }, [editingTitle])

  const finishEditingTitle = useCallback(() => {
    setEditingTitle(false)
    updateNote(storageId, noteId, { title: newTitle })
  }, [storageId, noteId, newTitle, updateNote])

  const stopEditingTitle = useCallback(() => {
    setEditingTitle(false)
  }, [])

  const updateNewTitle = useCallback((event) => {
    setNewTitle(event.target.value)
  }, [])

  const handleTitleInputKeyDown = useCallback(
    (event: KeyboardEvent<HTMLInputElement>) => {
      switch (event.key) {
        case 'Enter':
          event.preventDefault()
          finishEditingTitle()
          return
        case 'Escape':
          event.preventDefault()
          stopEditingTitle()
      }
    },
    [finishEditingTitle, stopEditingTitle]
  )

  useEffect(() => {
    noteDetailFocusTitleInputEventEmitter.listen(startEditingTitle)
    return () => {
      noteDetailFocusTitleInputEventEmitter.unlisten(startEditingTitle)
    }
  }, [startEditingTitle])

  useEffect(() => {
    addIpcListener('focus-title', startEditingTitle)
    return () => {
      removeIpcListener('focus-title', startEditingTitle)
    }
  }, [startEditingTitle])

  const [
    showingParentFolderListPopup,
    setShowingParentFolderPathnamePopup,
  ] = useState(false)
  const showParentFolderListPopup = useCallback(() => {
    setShowingParentFolderPathnamePopup(true)
  }, [])
  const hideParentFolderListPopup: FocusEventHandler<HTMLDivElement> = useCallback(
    (event) => {
      if (
        parentFolderListPopupRef.current != null &&
        !isChildNode(
          parentFolderListPopupRef.current,
          event.relatedTarget as HTMLElement | null
        )
      ) {
        setShowingParentFolderPathnamePopup(false)
      }
    },
    []
  )
  const parentFolderListPopupRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (
      showingParentFolderListPopup &&
      parentFolderListPopupRef.current != null
    ) {
      parentFolderListPopupRef.current.focus()
    }
  }, [showingParentFolderListPopup])

  return (
    <>
      <ToolbarButton
        title='Navigate to Workspace'
        onClick={navigateToWorkspace}
        iconPath={mdiBookOpen}
        label='Workspace'
      />
      {folderDataList.length > 1 && (
        <>
          <ToolbarSlashSeparator />
          <ToolbarButton
            title={t('toolbar.parentFolders')}
            iconPath={mdiDotsHorizontal}
            active={showingParentFolderListPopup}
            onClick={showParentFolderListPopup}
          />
          {showingParentFolderListPopup && (
            <ParentFolderListPopup
              tabIndex={-1}
              ref={parentFolderListPopupRef}
              onBlur={hideParentFolderListPopup}
            >
              <ul>
                {folderDataList
                  .slice(0, folderDataList.length - 1)
                  .map((folderData, index) => {
                    return (
                      <FolderTreeListItem
                        key={folderData.pathname}
                        storageId={storageId}
                        name={folderData.name}
                        pathname={folderData.pathname}
                        depth={index}
                      />
                    )
                  })}
              </ul>
            </ParentFolderListPopup>
          )}
        </>
      )}
      {folderDataList.length > 0 && (
        <>
          <ToolbarSlashSeparator />
          <ToolbarButton
            iconPath={mdiFolderOutline}
            title={t('toolbar.navigateToFolder', {
              folder: folderDataList[folderDataList.length - 1].pathname,
            })}
            label={folderDataList[folderDataList.length - 1].name}
            limitWidth={true}
            onClick={() => {
              push(
                `/app/storages/${storageId}/notes${
                  folderDataList[folderDataList.length - 1].pathname
                }`
              )
            }}
          />
        </>
      )}

      <ToolbarSlashSeparator />
      {editingTitle ? (
        <TitleInput
          ref={titleInputRef}
          value={newTitle}
          onChange={updateNewTitle}
          onKeyDown={handleTitleInputKeyDown}
          onBlur={finishEditingTitle}
          placeholder='Title'
        />
      ) : (
        <NoteTitleButton title={noteTitle} onClick={startEditingTitle} />
      )}
    </>
  )
}

export default NotePageToolbarNoteHeader

const TitleInput = styled.input`
  ${inputStyle}
  flex: 1;
  margin: 0 5px;
  display: block;
`

interface NoteTitleButtonProps {
  title?: string
  onClick: MouseEventHandler<HTMLButtonElement>
}

const NoteTitleButton = ({ title, onClick }: NoteTitleButtonProps) => {
  const titleIsEmpty = title == null || title.trim().length === 0

  return (
    <Tooltip text={'Edit Title'}>
      <NoteTitleButtonContainer onClick={onClick}>
        <Icon className='icon' path={mdiCardTextOutline} />
        <div className={cc(['label', titleIsEmpty && 'empty'])}>
          {titleIsEmpty ? 'Untitled' : title}
        </div>
        <Icon className='hoverIcon' path={mdiPencilOutline} />
      </NoteTitleButtonContainer>
    </Tooltip>
  )
}

const NoteTitleButtonContainer = styled.button`
  height: 34px;
  min-width: 28px;

  box-sizing: border-box;
  outline: none;

  background-color: transparent;
  ${flexCenter}
  overflow: hidden;

  border: none;
  cursor: pointer;
  padding: 0 5px;

  & > .icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  & > .label {
    font-size: 14px;
    ${textOverflow}
    &.empty {
      color: ${({ theme }) => theme.disabledUiTextColor};
    }
  }

  & > .icon + .label {
    margin-left: 2px;
  }

  & > .hoverIcon {
    margin-left: 2px;
    opacity: 0;
    transition: opacity 200ms ease-in-out;
  }

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.navItemColor};
  &:hover {
    color: ${({ theme }) => theme.navButtonHoverColor};

    & > .hoverIcon {
      opacity: 1;
    }
  }

  &:active,
  &.active {
    color: ${({ theme }) => theme.navButtonActiveColor};
    & > .hoverIcon {
      opacity: 1;
    }
  }
`

const ParentFolderListPopup = styled.div`
  position: fixed;
  z-index: 1000;
  max-height: 300px;
  top: 30px;
  ${({ theme }) => theme.shadow};
  background-color: ${({ theme }) => theme.backgroundColor};
  ${border};
  border-radius: 4px;
  overflow-y: auto;
  overflow-x: hidden;
  & > ul {
    padding: 0;
    margin: 0;
    list-style: none;
  }
`
