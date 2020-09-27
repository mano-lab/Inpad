import React from 'react'
import { includes } from 'ramda'
import {
  NoteDoc,
  NoteDocEditibleProps,
  Attachment,
  ObjectMap,
} from '../../../lib/db/types'
import { isTagNameValid } from '../../../lib/db/utils'
import TagList from '../molecules/TagList'
import styled from '../../../lib/styled'
import CustomizedCodeEditor from '../../../components/atoms/CustomizedCodeEditor'
import CustomizedMarkdownPreviewer from '../../../components/atoms/CustomizedMarkdownPreviewer'
import ToolbarSeparator from '../../../components/atoms/ToolbarSeparator'
import {
  textColor,
  borderBottom,
  borderRight,
  inputStyle,
  backgroundColor,
} from '../../../lib/styled/styleFunctions'
import { ViewModeType } from '../../lib/generalStatus'
import {
  listenNoteDetailFocusTitleInputEvent,
  unlistenNoteDetailFocusTitleInputEvent,
} from '../../../lib/events'
import Icon from '../../../components/atoms/Icon'
import { mdiPlus } from '@mdi/js'
import { codeMirrorPasteHandler } from '../../../lib/eventHandler/pasteHandler'

export const NoteDetailContainer = styled.div`
  ${backgroundColor};
  display: flex;
  flex-direction: column;
  height: 100%;

  .titleSection {
    display: flex;
    height: 50px;
    border-width: 0 0 1px;
    ${borderBottom}

    input {
      font-size: 24px;
      border: none;
      height: 100%;
      padding: 0 12px;
      flex: 1;
      background-color: transparent;
      ${textColor}
    }
  }

  .contentSection {
    flex: 1;
    overflow: hidden;
    position: relative;
    .editor .CodeMirror {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
    }
    .MarkdownPreviewer {
      position: absolute;
      top: 0;
      bottom: 0;
      width: 100%;
      height: 100%;
      overflow: auto;
      padding: 0 10px;
      box-sizing: border-box;
    }
    .splitLeft {
      position: absolute;
      width: 50%;
      height: 100%;
      ${borderRight}
    }
    .splitRight {
      position: absolute;
      left: 50%;
      width: 50%;
      height: 100%;
    }
  }

  .tagInput {
    background-color: transparent;
    border: none;
    ${textColor}
    margin-left: 4px;
  }

  .buttonsWrapper {
    button + button {
      margin-left: 8px;
    }
  }

  .tagsWrapper {
    height: 40px;
    padding: 5px 0;
    display: flex;
    min-width: 20px;
    overflow-x: auto;
    input {
      min-width: 0 !important;
      width: 100%;
    }
    button.addButton {
      ${inputStyle}
    }
  }
`

type NoteDetailProps = {
  currentPathnameWithoutNoteId: string
  note: NoteDoc
  storageId: string
  attachmentMap: ObjectMap<Attachment>
  updateNote: (
    storageId: string,
    noteId: string,
    props: Partial<NoteDocEditibleProps>
  ) => Promise<void | NoteDoc>
  trashNote: (storageId: string, noteId: string) => Promise<NoteDoc | undefined>
  untrashNote: (
    storageId: string,
    noteId: string
  ) => Promise<NoteDoc | undefined>
  purgeNote: (storageId: string, noteId: string) => void
  viewMode: ViewModeType
  toggleViewMode: (mode: ViewModeType) => void
  addAttachments(storageId: string, files: File[]): Promise<Attachment[]>
}

type NoteDetailState = {
  prevStorageId: string
  prevNoteId: string
  title: string
  content: string
  tags: string[]
  newTagName: string
}

export default class NoteDetail extends React.Component<
  NoteDetailProps,
  NoteDetailState
> {
  state: NoteDetailState = {
    prevStorageId: '',
    prevNoteId: '',
    title: '',
    content: '',
    tags: [],
    newTagName: '',
  }
  titleInputRef = React.createRef<HTMLInputElement>()
  newTagNameInputRef = React.createRef<HTMLInputElement>()
  codeMirror?: CodeMirror.EditorFromTextArea
  codeMirrorRef = (codeMirror: CodeMirror.EditorFromTextArea) => {
    this.codeMirror = codeMirror
  }

  static getDerivedStateFromProps(
    props: NoteDetailProps,
    state: NoteDetailState
  ): NoteDetailState {
    const { note, storageId } = props
    if (storageId !== state.prevStorageId || note._id !== state.prevNoteId) {
      return {
        prevStorageId: storageId,
        prevNoteId: note._id,
        title: note.title,
        content: note.content,
        tags: note.tags,
        newTagName: '',
      }
    }
    return state
  }

  componentDidUpdate(_prevProps: NoteDetailProps, prevState: NoteDetailState) {
    const { note } = this.props
    if (prevState.prevNoteId !== note._id) {
      if (this.queued) {
        const { title, content, tags } = prevState
        this.saveNote(prevState.prevStorageId, prevState.prevNoteId, {
          title,
          content,
          tags,
        })
      }
    }
    listenNoteDetailFocusTitleInputEvent(this.focusTitleInput)
  }

  componentWillUnmount() {
    if (this.queued) {
      const { title, content, tags, prevStorageId, prevNoteId } = this.state
      this.saveNote(prevStorageId, prevNoteId, {
        title,
        content,
        tags,
      })
    }
    unlistenNoteDetailFocusTitleInputEvent(this.focusTitleInput)
  }

  focusTitleInput = () => {
    this.titleInputRef.current!.focus()
  }

  updateTitle = () => {
    this.setState(
      {
        title: this.titleInputRef.current!.value,
      },
      () => {
        this.queueToSave()
      }
    )
  }

  updateContent = (
    newValueOrUpdater: string | ((prevValue: string) => string)
  ) => {
    const updater =
      typeof newValueOrUpdater === 'string'
        ? () => newValueOrUpdater
        : newValueOrUpdater
    this.setState(
      (prevState) => {
        return {
          content: updater(prevState.content),
        }
      },
      () => {
        this.queueToSave()
      }
    )
  }

  updateNewTagName = () => {
    this.setState({
      newTagName: this.newTagNameInputRef.current!.value,
    })
  }

  handleNewTagNameInputKeyDown: React.KeyboardEventHandler = (event) => {
    switch (event.key) {
      case 'Enter':
        event.preventDefault()
        this.appendNewTag()
        return
    }
  }

  appendNewTag = () => {
    if (includes(this.state.newTagName, this.state.tags)) {
      return
    }
    if (!isTagNameValid(this.state.newTagName)) {
      return
    }
    this.setState(
      (prevState) => ({
        newTagName: '',
        tags: [...prevState.tags, prevState.newTagName],
      }),
      () => {
        this.queueToSave()
      }
    )
  }

  removeTagByName = (tagName: string) => {
    this.setState(
      (prevState) => ({
        tags: prevState.tags.filter((aTagName) => aTagName !== tagName),
      }),
      () => {
        this.queueToSave()
      }
    )
  }

  trashNote = async () => {
    const { note, storageId } = this.props
    const noteId = note._id

    if (this.queued) {
      const { title, content, tags } = this.state
      await this.saveNote(storageId, noteId, {
        title,
        content,
        tags,
      })
    }
    await this.props.trashNote(storageId, noteId)
  }

  untrashNote = async () => {
    const { note, storageId } = this.props
    const noteId = note._id

    if (this.queued) {
      const { title, content, tags } = this.state
      await this.saveNote(storageId, noteId, {
        title,
        content,
        tags,
      })
    }
    await this.props.untrashNote(storageId, noteId)
  }

  purgeNote = async () => {
    const { note, storageId } = this.props
    const noteId = note._id

    if (this.queued) {
      const { title, content, tags } = this.state
      await this.saveNote(storageId, noteId, {
        title,
        content,
        tags,
      })
    }
    await this.props.purgeNote(storageId, noteId)
  }

  queued = false
  timer?: any

  queueToSave = () => {
    this.queued = true
    if (this.timer != null) {
      clearTimeout(this.timer)
    }
    this.timer = setTimeout(() => {
      const { note, storageId } = this.props
      const { title, content, tags } = this.state

      this.saveNote(storageId, note._id, { title, content, tags })
    }, 3000)
  }

  async saveNote(
    storageId: string,
    noteId: string,
    { title, content, tags }: { title: string; content: string; tags: string[] }
  ) {
    clearTimeout(this.timer)
    this.queued = false

    const { updateNote } = this.props
    await updateNote(storageId, noteId, {
      title,
      content,
      tags,
    })
  }

  refreshCodeEditor = () => {
    if (this.codeMirror != null) {
      this.codeMirror.refresh()
    }
  }

  render() {
    const { note, viewMode, attachmentMap } = this.props

    return (
      <NoteDetailContainer>
        {note == null ? (
          <p>No note is selected</p>
        ) : (
          <>
            <div className='titleSection'>
              <input
                ref={this.titleInputRef}
                value={this.state.title}
                onChange={this.updateTitle}
                placeholder='Title'
              />
            </div>
            <div className='tagsWrapper'>
              <TagList
                tags={this.state.tags}
                removeTagByName={this.removeTagByName}
              />
              <input
                className='tagInput'
                ref={this.newTagNameInputRef}
                value={this.state.newTagName}
                placeholder='Tags'
                onChange={this.updateNewTagName}
                onKeyDown={this.handleNewTagNameInputKeyDown}
              />
              {this.state.newTagName.trim().length > 0 && (
                <button className='addButton' onClick={this.appendNewTag}>
                  <Icon path={mdiPlus} />
                </button>
              )}
              <ToolbarSeparator />
            </div>
            <div className='contentSection'>
              {viewMode === 'preview' ? (
                <CustomizedMarkdownPreviewer
                  content={this.state.content}
                  attachmentMap={attachmentMap}
                  updateContent={this.updateContent}
                />
              ) : (
                <CustomizedCodeEditor
                  className='editor'
                  key={note._id}
                  codeMirrorRef={this.codeMirrorRef}
                  value={this.state.content}
                  onChange={this.updateContent}
                  onPaste={codeMirrorPasteHandler}
                />
              )}
            </div>
          </>
        )}
      </NoteDetailContainer>
    )
  }
}
