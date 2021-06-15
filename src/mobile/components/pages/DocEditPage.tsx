import React, { useState, useCallback, useRef, useEffect, useMemo } from 'react'
import { getColorFromString } from '../../../cloud/lib/utils/string'
import styled from '../../../cloud/lib/styled'
import { SerializedDocWithBookmark } from '../../../cloud/interfaces/db/doc'
import {
  useSettings,
  CodeMirrorKeyMap,
} from '../../../cloud/lib/stores/settings'
import useRealtime from '../../../cloud/lib/editor/hooks/useRealtime'
import Spinner from '../../../cloud/components/atoms/CustomSpinner'
import attachFileHandlerToCodeMirrorEditor, {
  OnFileCallback,
} from '../../../cloud/lib/editor/plugins/fileHandler'
import { uploadFile, buildTeamFileUrl } from '../../../cloud/api/teams/files'
import {
  createRelativePositionFromTypeIndex,
  createAbsolutePositionFromRelativePosition,
} from 'yjs'
import { SerializedTeam } from '../../../cloud/interfaces/db/team'
import {
  getDocTitle,
  getTeamURL,
  getDocURL,
} from '../../../cloud/lib/utils/patterns'
import { SerializedUser } from '../../../cloud/interfaces/db/user'
import { usePreferences } from '../../../cloud/lib/stores/preferences'
import { rightSidePageLayout } from '../../../cloud/lib/styled/styleFunctions'
import { useRouter } from '../../../cloud/lib/router'
import {
  pasteFormatPlugin,
  PositionRange,
  Callback,
} from '../../../cloud/lib/editor/plugins/pasteFormatPlugin'
import { buildIconUrl } from '../../../cloud/api/files'
import {
  mdiRepeat,
  mdiRepeatOff,
  mdiFileDocumentOutline,
  mdiCommentTextOutline,
} from '@mdi/js'
import { not } from 'ramda'
import { useNav } from '../../../cloud/lib/stores/nav'
import { Hint } from 'codemirror'
import { EmbedDoc } from '../../../cloud/lib/docEmbedPlugin'
import { SerializedTemplate } from '../../../cloud/interfaces/db/template'
import TemplatesModal from '../../../cloud/components/organisms/Modal/contents/TemplatesModal'
import {
  focusTitleEventEmitter,
  focusEditorEventEmitter,
  toggleSplitEditModeEventEmitter,
  togglePreviewModeEventEmitter,
} from '../../../cloud/lib/utils/events'
import { ScrollSync, scrollSyncer } from '../../../cloud/lib/editor/scrollSync'
import CodeMirrorEditor from '../../../cloud/lib/editor/components/CodeMirrorEditor'
import MarkdownView, {
  SelectionContext,
} from '../../../cloud/components/atoms/MarkdownView'
import { useToast } from '../../../shared/lib/stores/toast'
import { trackEvent } from '../../../cloud/api/track'
import { MixpanelActionTrackTypes } from '../../../cloud/interfaces/analytics/mixpanel'
import { useModal } from '../../../shared/lib/stores/modal'
import Icon from '../../../cloud/components/atoms/Icon'
import useCommentManagerState from '../../../shared/lib/hooks/useCommentManagerState'
import { HighlightRange } from '../../../cloud/lib/rehypeHighlight'
import EditorSelectionStatus from '../../../cloud/components/molecules/Editor/EditorSelectionStatus'
import EditorThemeSelect from '../../../cloud/components/molecules/Editor/EditorThemeSelect'
import EditorKeyMapSelect from '../../../cloud/components/molecules/Editor/EditorKeyMapSelect'
import EditorTemplateButton from '../../../cloud/components/molecules/Editor/EditorTemplateButton'
import AppLayout from '../layouts/AppLayout'
import EditorIndentationStatus from '../../../cloud/components/molecules/Editor/EditorIndentationStatus'
import EditorToolButton from '../../../cloud/components/molecules/Editor/EditorToolButton'
import EditorToolbar from '../../../cloud/components/molecules/Editor/EditorToolbar'
import EditorToolbarUpload from '../../../cloud/components/molecules/Editor/EditorToolbarUpload'

type LayoutMode = 'split' | 'preview' | 'editor'

interface EditorProps {
  doc: SerializedDocWithBookmark
  team: SerializedTeam
  user: SerializedUser
}

interface EditorPosition {
  line: number
  ch: number
}

interface SelectionState {
  currentCursor: EditorPosition
  currentSelections: {
    head: EditorPosition
    anchor: EditorPosition
  }[]
}

const Editor = ({ doc, team, user }: EditorProps) => {
  const { pushMessage, pushApiErrorMessage } = useToast()
  const [color] = useState(() => getColorFromString(user.id))
  const { preferences, setPreferences } = usePreferences()
  const editorRef = useRef<CodeMirror.Editor | null>(null)
  const [initialLoadDone, setInitialLoadDone] = useState(false)
  const fileUploadHandlerRef = useRef<OnFileCallback>()
  const [editorLayout, setEditorLayout] = useState<LayoutMode>(
    preferences.lastEditorMode != 'preview'
      ? preferences.lastEditorEditLayout
      : 'preview'
  )
  const [editorContent, setEditorContent] = useState('')
  const docRef = useRef<string>('')
  const { state } = useRouter()
  const [shortcodeConvertMenu, setShortcodeConvertMenu] = useState<{
    pos: PositionRange
    cb: Callback
  } | null>(null)
  const initialRenderDone = useRef(false)
  const titleRef = useRef<HTMLInputElement>(null)
  const [selection, setSelection] = useState<SelectionState>({
    currentCursor: {
      line: 0,
      ch: 0,
    },
    currentSelections: [
      {
        head: {
          line: 0,
          ch: 0,
        },
        anchor: {
          line: 0,
          ch: 0,
        },
      },
    ],
  })
  const { docsMap, workspacesMap } = useNav()
  const suggestionsRef = useRef<Hint[]>([])

  const userInfo = useMemo(() => {
    return {
      id: user.id,
      name: user.displayName,
      color: color,
      icon: user.icon != null ? buildIconUrl(user.icon.location) : undefined,
    }
  }, [user, color])

  const [realtime, connState] = useRealtime({
    token: doc.collaborationToken || doc.id,
    id: doc.id,
    userInfo,
  })

  const [commentState, commentActions] = useCommentManagerState(doc.id)

  const newRangeThread = useCallback(
    (selection: SelectionContext) => {
      if (realtime == null) {
        return
      }
      const text = realtime.doc.getText('content')
      const anchor = createRelativePositionFromTypeIndex(text, selection.start)
      const head = createRelativePositionFromTypeIndex(text, selection.end)
      setPreferences({ docContextMode: 'comment' })
      commentActions.setMode({
        mode: 'new_thread',
        context: selection.text,
        selection: {
          anchor,
          head,
        },
      })
    },
    [realtime, commentActions, setPreferences]
  )

  const [viewComments, setViewComments] = useState<HighlightRange[]>([])
  const calculatePositions = useCallback(() => {
    if (commentState.mode === 'list_loading' || realtime == null) {
      return
    }

    const comments: HighlightRange[] = []
    for (const thread of commentState.threads) {
      if (thread.selection != null && thread.status.type !== 'outdated') {
        const absoluteAnchor = createAbsolutePositionFromRelativePosition(
          thread.selection.anchor,
          realtime.doc
        )
        const absoluteHead = createAbsolutePositionFromRelativePosition(
          thread.selection.head,
          realtime.doc
        )

        if (
          absoluteAnchor != null &&
          absoluteHead != null &&
          absoluteAnchor.index !== absoluteHead.index
        ) {
          if (thread.status.type === 'open') {
            comments.push({
              id: thread.id,
              start: absoluteAnchor.index,
              end: absoluteHead.index,
              active:
                commentState.mode === 'thread' &&
                thread.id === commentState.thread.id,
            })
          }
        } else if (connState === 'synced') {
          commentActions.threadOutdated(thread)
        }
      }
    }
    setViewComments(comments)
  }, [commentState, realtime, commentActions, connState])

  useEffect(() => {
    if (realtime != null) {
      realtime.doc.on('update', calculatePositions)
      return () => realtime.doc.off('update', calculatePositions)
    }
    return undefined
  }, [realtime, calculatePositions])

  useEffect(() => {
    calculatePositions()
  }, [calculatePositions])

  const commentClick = useCallback(
    (ids: string[]) => {
      if (commentState.mode !== 'list_loading') {
        const idSet = new Set(ids)
        setPreferences({ docContextMode: 'comment' })
        commentActions.setMode({
          mode: 'list',
          filter: (thread) => idSet.has(thread.id),
        })
      }
    },
    [commentState, commentActions, setPreferences]
  )

  const changeEditorLayout = useCallback(
    (target: LayoutMode) => {
      setEditorLayout(target)
      if (target === 'preview') {
        setPreferences({
          lastEditorMode: 'preview',
        })
        return
      }

      setPreferences({
        lastEditorMode: 'edit',
        lastEditorEditLayout: target,
      })
    },
    [setPreferences]
  )

  const docIsNew = !!state?.new
  useEffect(() => {
    if (docRef.current !== doc.id) {
      if (docIsNew) {
        changeEditorLayout(preferences.lastEditorEditLayout)
        if (titleRef.current != null) {
          titleRef.current.focus()
        }
      } else {
        setEditorLayout(
          preferences.lastEditorMode === 'preview'
            ? 'preview'
            : preferences.lastEditorEditLayout
        )
      }
      docRef.current = doc.id
    }
  }, [
    doc.id,
    docIsNew,
    preferences.lastEditorEditLayout,
    preferences.lastEditorMode,
    changeEditorLayout,
  ])

  useEffect(() => {
    if (editorLayout === 'preview') {
      return
    }

    if (editorRef.current != null) {
      editorRef.current.focus()
    }
  }, [editorLayout])

  useEffect(() => {
    if (!initialLoadDone) {
      return
    }
    if (editorRef.current != null) {
      editorRef.current.focus()
    } else if (titleRef.current != null) {
      titleRef.current.focus()
    }
  }, [initialLoadDone, docIsNew])

  useEffect(() => {
    if (team != null) {
      fileUploadHandlerRef.current = async (file) => {
        try {
          const { file: fileInfo } = await uploadFile(team, file, doc)
          const url = buildTeamFileUrl(team, fileInfo.name)
          if (file.type.match(/image\/.*/)) {
            return { type: 'img', url, alt: file.name }
          } else {
            return { type: 'file', url, title: file.name }
          }
        } catch (err) {
          pushApiErrorMessage(err)
          return null
        }
      }
    } else {
      fileUploadHandlerRef.current = undefined
    }
  }, [team, pushMessage, pushApiErrorMessage, doc])

  useEffect(() => {
    return () => {
      setInitialLoadDone(false)
    }
  }, [doc.id])

  useEffect(() => {
    if (connState === 'synced' || connState === 'loaded') {
      setInitialLoadDone(true)
    }
  }, [connState])

  useEffect(() => {
    suggestionsRef.current = Array.from(docsMap.values()).map((doc) => {
      const workspace = workspacesMap.get(doc.workspaceId)
      const path = `${workspace != null ? workspace.name : ''}${
        doc.folderPathname === '/' ? '' : doc.folderPathname
      }`
      return {
        text: `[[ boostnote.doc id="${doc.id}" ]]`,
        displayText: `${path}/${getDocTitle(doc)}`,
      }
    })
  }, [docsMap, workspacesMap])

  const previewRef = useRef<HTMLDivElement>(null)
  const syncScroll = useRef<ScrollSync>()
  const [scrollSync, setScrollSync] = useState(true)

  useEffect(() => {
    if (syncScroll.current != null) {
      scrollSync ? syncScroll.current.unpause() : syncScroll.current.pause()
    }
  }, [scrollSync])

  const onRender = useRef(() => {
    if (!initialRenderDone.current && window.location.hash) {
      const ele = document.getElementById(window.location.hash.substr(1))
      if (ele != null) {
        ele.scrollIntoView(true)
      }
      initialRenderDone.current = true
    }
    if (previewRef.current != null && editorRef.current != null) {
      if (syncScroll.current == null) {
        syncScroll.current = scrollSyncer(editorRef.current, previewRef.current)
      } else {
        syncScroll.current.rebuild()
      }
    }
  })

  useEffect(() => {
    return () => {
      if (syncScroll.current != null) {
        syncScroll.current.destroy()
        syncScroll.current = undefined
      }
    }
  }, [doc])

  const bindCallback = useCallback((editor: CodeMirror.Editor) => {
    setEditorContent(editor.getValue())
    editorRef.current = editor
    attachFileHandlerToCodeMirrorEditor(editor, {
      onFile: async (file) => {
        return fileUploadHandlerRef.current != null
          ? fileUploadHandlerRef.current(file)
          : null
      },
    })
    pasteFormatPlugin(editor, {
      openMenu: (pos, cb) => {
        setShortcodeConvertMenu({ pos, cb })
      },
      closeMenu: () => {
        setShortcodeConvertMenu(null)
      },
      formatter: (pasted) => {
        const githubRegex = /https:\/\/github.com\/([^\/\s]+)\/([^\/\s]+)\/(pull|issues)\/(\d+)/
        const githubMatch = githubRegex.exec(pasted)
        if (githubMatch == null) {
          return null
        }
        const [, org, repo, type, num] = githubMatch
        const entityType = type === 'pull' ? 'github.pr' : 'github.issue'
        return `[[ ${entityType} id="${org}/${repo}#${num}" ]]`
      },
    })
    editor.on('change', (instance) => {
      setEditorContent(instance.getValue())
    })
    editor.on('inputRead', (_, change) => {
      if (change.origin !== '+input') return

      if (editor.getLine(change.to.line) === '[[') {
        editor.showHint({
          container: editor.getWrapperElement(),
          closeOnUnfocus: false,
          alignWithWord: true,
          closeCharacters: /[\n]/,
          hint: () => {
            const line = editor.getLine(editor.getCursor().line)
            const filter = line.slice(2)
            const list = suggestionsRef.current.filter((hint) => {
              return (
                hint.displayText != null &&
                hint.displayText.toLowerCase().includes(filter.toLowerCase())
              )
            })
            return {
              from: { ch: 0, line: change.to.line },
              to: { ch: line.length, line: change.to.line },
              list,
            }
          },
        })
      }
    })
    editor.on('cursorActivity', (codeMirror: CodeMirror.Editor) => {
      const doc = codeMirror.getDoc()
      const { line, ch } = doc.getCursor()
      const selections = doc.listSelections()

      setSelection({
        currentCursor: {
          line,
          ch,
        },
        currentSelections: selections,
      })
    })
  }, [])

  useEffect(() => {
    if (editorRef.current != null) {
      editorRef.current.refresh()
    }
  }, [editorLayout])

  const onTemplatePickCallback = useCallback(
    (template: SerializedTemplate) => {
      if (editorRef.current == null || realtime == null) {
        return
      }
      editorRef.current.setValue(template.content)
    },
    [realtime]
  )

  const { settings } = useSettings()
  const editorConfig: CodeMirror.EditorConfiguration = useMemo(() => {
    const editorTheme = settings['general.editorTheme']
    const theme =
      editorTheme == null || editorTheme === 'default'
        ? settings['general.theme'] === 'light'
          ? 'default'
          : 'material-darker'
        : editorTheme === 'solarized-dark'
        ? 'solarized dark'
        : editorTheme
    const keyMap = resolveKeyMap(settings['general.editorKeyMap'])
    const editorIndentType = settings['general.editorIndentType']
    const editorIndentSize = settings['general.editorIndentSize']

    return {
      mode: 'markdown',
      lineNumbers: true,
      lineWrapping: true,
      theme,
      indentWithTabs: editorIndentType === 'tab',
      indentUnit: editorIndentSize,
      tabSize: editorIndentSize,
      keyMap,
      extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList',
        Tab: 'indentMore',
      },
    }
  }, [settings])

  const setEditorRefContent = useCallback(
    (newValueOrUpdater: string | ((prevValue: string) => string)) => {
      if (editorRef.current == null) {
        return
      }
      const updater =
        typeof newValueOrUpdater === 'string'
          ? () => newValueOrUpdater
          : newValueOrUpdater
      editorRef.current.setValue(updater(editorContent))
    },
    [editorRef, editorContent]
  )

  const { openModal } = useModal()
  const onEditorTemplateToolClick = useCallback(() => {
    openModal(<TemplatesModal callback={onTemplatePickCallback} />, {
      width: 'large',
    })
  }, [openModal, onTemplatePickCallback])

  const toggleScrollSync = useCallback(() => {
    setScrollSync(not)
  }, [])

  const embeddableDocs = useMemo(() => {
    const embedMap = new Map<string, EmbedDoc>()
    if (team == null) {
      return embedMap
    }

    for (const doc of docsMap.values()) {
      if (doc.head != null) {
        const current = `${location.protocol}//${location.host}`
        const link = `${current}${getTeamURL(team)}${getDocURL(doc)}`
        embedMap.set(doc.id, {
          title: doc.title,
          content: doc.head.content,
          link,
        })
      }
    }
    return embedMap
  }, [docsMap, team])

  const shortcodeConvertMenuStyle: React.CSSProperties = useMemo(() => {
    if (shortcodeConvertMenu == null || editorRef.current == null) {
      return {}
    }

    const editorScroll = editorRef.current.getScrollInfo()
    const bottomPositioning =
      shortcodeConvertMenu.pos.from.bottom - editorScroll.top

    return {
      position: 'absolute',
      top: `${
        bottomPositioning + 125 > editorScroll.clientHeight
          ? bottomPositioning - 140
          : bottomPositioning
      }px`,
      left: `${
        (shortcodeConvertMenu.pos.to.left -
          shortcodeConvertMenu.pos.from.left) /
          2 +
        shortcodeConvertMenu.pos.from.left
      }px`,
    }
  }, [shortcodeConvertMenu])

  const focusEditor = useCallback(() => {
    if (editorLayout === 'preview') {
      return
    }

    if (editorRef.current == null) {
      return
    }

    editorRef.current.focus()
  }, [editorLayout])

  const focusTitleInputRef = useRef<() => void>()
  useEffect(() => {
    const handler = () => {
      if (focusTitleInputRef.current == null) {
        return
      }
      focusTitleInputRef.current()
    }
    focusTitleEventEmitter.listen(handler)

    return () => {
      focusTitleEventEmitter.unlisten(handler)
    }
  }, [])

  useEffect(() => {
    focusEditorEventEmitter.listen(focusEditor)
    return () => {
      focusEditorEventEmitter.unlisten(focusEditor)
    }
  }, [focusEditor])

  const updateLayout = useCallback(
    (mode: LayoutMode) => {
      if (editorLayout === 'preview' && mode !== 'preview') {
        trackEvent(MixpanelActionTrackTypes.DocLayoutEdit, {
          team: doc.teamId,
          doc: doc.id,
        })
      }

      changeEditorLayout(mode)
    },
    [changeEditorLayout, doc.id, doc.teamId, editorLayout]
  )

  const toggleViewMode = useCallback(() => {
    if (editorLayout === 'preview') {
      changeEditorLayout(preferences.lastEditorEditLayout)
      return
    }

    trackEvent(MixpanelActionTrackTypes.DocLayoutEdit, {
      team: doc.teamId,
      doc: doc.id,
    })
    changeEditorLayout('preview')
  }, [
    changeEditorLayout,
    preferences.lastEditorEditLayout,
    editorLayout,
    doc.teamId,
    doc.id,
  ])

  useEffect(() => {
    togglePreviewModeEventEmitter.listen(toggleViewMode)
    return () => {
      togglePreviewModeEventEmitter.unlisten(toggleViewMode)
    }
  }, [toggleViewMode])

  const toggleSplitEditMode = useCallback(() => {
    updateLayout(editorLayout === 'split' ? 'editor' : 'split')
  }, [updateLayout, editorLayout])

  useEffect(() => {
    toggleSplitEditModeEventEmitter.listen(toggleSplitEditMode)
    return () => {
      toggleSplitEditModeEventEmitter.unlisten(toggleSplitEditMode)
    }
  }, [toggleSplitEditMode])

  if (!initialLoadDone) {
    return (
      <AppLayout>
        <StyledLoadingView>
          <h3>Loading..</h3>
          <span>
            <Spinner />
          </span>
        </StyledLoadingView>
      </AppLayout>
    )
  }
  return (
    <AppLayout>
      <Container>
        {editorLayout !== 'preview' && (
          <StyledLayoutDimensions className={editorLayout}>
            <ToolbarRow>
              <EditorToolButton
                tooltip={`${scrollSync ? 'Disable' : 'Enable'} scroll sync`}
                path={scrollSync ? mdiRepeatOff : mdiRepeat}
                onClick={toggleScrollSync}
                className='scroll-sync'
              />
              <EditorToolbar
                editorRef={editorRef}
                team={team}
                currentDoc={doc}
              />
              <EditorToolbarUpload
                editorRef={editorRef}
                fileUploadHandlerRef={fileUploadHandlerRef}
              />
              <EditorToolButton
                tooltip='Use a template'
                path={mdiFileDocumentOutline}
                onClick={onEditorTemplateToolClick}
              />
            </ToolbarRow>
          </StyledLayoutDimensions>
        )}
        <StyledEditor className={editorLayout}>
          <StyledEditorWrapper className={`layout-${editorLayout}`}>
            <>
              <CodeMirrorEditor
                bind={bindCallback}
                config={editorConfig}
                realtime={realtime}
              />
              {editorContent === '' && (
                <EditorTemplateButton
                  onTemplatePickCallback={onTemplatePickCallback}
                />
              )}
              {shortcodeConvertMenu !== null && (
                <StyledShortcodeConvertMenu style={shortcodeConvertMenuStyle}>
                  <button onClick={() => shortcodeConvertMenu.cb(false)}>
                    Dismiss
                  </button>
                  <button onClick={() => shortcodeConvertMenu.cb(true)}>
                    Create embed
                  </button>
                </StyledShortcodeConvertMenu>
              )}
            </>
          </StyledEditorWrapper>
          <StyledPreview className={`layout-${editorLayout}`}>
            <MarkdownView
              content={editorContent}
              updateContent={setEditorRefContent}
              headerLinks={editorLayout === 'preview'}
              onRender={onRender.current}
              className='scroller'
              embeddableDocs={embeddableDocs}
              scrollerRef={previewRef}
              comments={viewComments}
              commentClick={commentClick}
              SelectionMenu={({ selection }) => (
                <StyledSelectionMenu>
                  <div onClick={() => newRangeThread(selection)}>
                    <Icon size={21} path={mdiCommentTextOutline} />
                  </div>
                </StyledSelectionMenu>
              )}
            />
          </StyledPreview>
        </StyledEditor>

        {editorLayout !== 'preview' && (
          <StyledBottomBar>
            <EditorSelectionStatus
              cursor={selection.currentCursor}
              selections={selection.currentSelections}
            />
            <EditorKeyMapSelect />
            <EditorThemeSelect />
            <EditorIndentationStatus />
          </StyledBottomBar>
        )}
      </Container>
    </AppLayout>
  )
}

const Container = styled.div`
  display: flex;
  flex-direction: column;
  flex-grow: 1;
  width: 100%;
  height: 100%;
`

const StyledBottomBar = styled.div`
  display: flex;
  position: relative;
  flex: 0 0 auto;
  border-top: solid 1px ${({ theme }) => theme.baseBorderColor};
  height: 24px;
  background-color: ${({ theme }) => theme.baseBackgroundColor};
  box-sizing: content-box;
  & > :first-child {
    flex: 1;
  }
`

const StyledShortcodeConvertMenu = styled.div`
  margin-top: ${({ theme }) => theme.space.xsmall}px;
  border-radius: 5px;
  box-shadow: ${({ theme }) => theme.baseShadowColor};

  button {
    display: block;
    width: 200px;
    line-height: 25px;
    padding: ${({ theme }) => theme.space.xsmall}px
      ${({ theme }) => theme.space.small}px;
    background-color: ${({ theme }) => theme.contextMenuColor};
    color: ${({ theme }) => theme.baseTextColor};
    font-size: ${({ theme }) => theme.fontSizes.small}px;
    text-align: left;

    &:first-child {
      border-radius: 5px 5px 0 0;
    }

    &:last-child {
      border-radius: 0 0 5px 5px;
    }

    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.subtleBackgroundColor};
      color: ${({ theme }) => theme.emphasizedTextColor};
      cursor: pointer;
    }
  }
`

const StyledLayoutDimensions = styled.div`
  width: 100%;
  &.preview,
  .preview {
    ${rightSidePageLayout}
    margin: ${({ theme }) => theme.space.default}px auto 0;
    height: auto;
  }
`

const StyledLoadingView = styled.div`
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  text-align: center;
  & span {
    width: 100%;
    height: 38px;
    position: relative;
  }
`

const ToolbarRow = styled.div`
  display: flex;
  flex-wrap: nowrap;
  align-items: end;
  margin-bottom: ${({ theme }) => theme.space.xxsmall}px;
  border-bottom: solid 1px ${({ theme }) => theme.divideBorderColor};
`

const StyledEditorWrapper = styled.div`
  position: relative;
  height: auto;
  width: 50%;
  &.layout-editor {
    width: 100%;
  }
  &.layout-preview {
    display: none;
  }
`

const StyledPreview = styled.div`
  height: 100%;
  width: 50%;
  &.layout-split {
    width: 50%;
    .scroller {
      height: 100%;
      overflow: auto;
      border-left: 1px solid ${({ theme }) => theme.baseBorderColor};
    }
  }
  &.layout-preview {
    padding-top: ${({ theme }) => theme.space.small}px;
    margin: 0 auto;
    width: 100%;
  }
  &.layout-editor {
    display: none;
  }

  & .inline-comment.active,
  .inline-comment.hv-active {
    background-color: rgba(112, 84, 0, 0.8);
  }
`

const StyledSelectionMenu = styled.div`
  display: flex;
  padding: 8px;
  max-height: 37px;
  cursor: pointer;
`

const StyledEditor = styled.div`
  display: flex;
  justify-content: center;
  flex-grow: 1;
  position: relative;
  top: 0;
  bottom: 0px;
  width: 100%;
  height: auto;
  min-height: 0;
  font-size: 15px;
  &.preview,
  .preview {
    ${rightSidePageLayout}
    margin: auto;
    padding: 0 ${({ theme }) => theme.space.xlarge}px;
  }
  & .CodeMirrorWrapper {
    height: 100%;
    word-break: break-word;
  }
  & .CodeMirror {
    width: 100%;
    height: 100%;
    position: relative;
    z-index: 0 !important;
    .CodeMirror-hints {
      position: absolute;
      z-index: 10;
      overflow: auto;
      max-width: 90%;
      max-height: 20em;
      margin: 0;
      padding: 0;
      border-radius: 3px;
      border: 1px solid ${({ theme }) => theme.baseBorderColor};
      background: ${({ theme }) => theme.baseBackgroundColor};
      color: ${({ theme }) => theme.baseTextColor};
      font-size: 90%;
      font-family: monospace;
      list-style: none;
    }
    .CodeMirror-hint {
      position: relative;
      margin: 0;
      padding: ${({ theme }) => theme.space.xxsmall}px
        ${({ theme }) => theme.space.small}px;
      white-space: pre;
      color: ${({ theme }) => theme.baseTextColor};
      cursor: pointer;
      font-size: ${({ theme }) => theme.fontSizes.xsmall}px;
    }
    li.CodeMirror-hint-active {
      color: ${({ theme }) => theme.primaryTextColor};
      &:before {
        content: '';
        display: block;
        position: absolute;
        top: 3px;
        left: ${({ theme }) => theme.space.xsmall}px;
        width: 3px;
        height: 22px;
        background-color: ${({ theme }) => theme.primaryBackgroundColor};
      }
    }
    & .remote-caret {
      position: relative;
      border-left: 1px solid black;
      margin-left: -1px;
      box-sizing: border-box;
      &:hover > div {
        opacity: 1;
        transition-delay: 0s;
      }
      & > div {
        position: absolute;
        left: -1px;
        height: 100%;
        top: 0;
        transform: translate3d(0, -100%, 0);
        font-size: ${({ theme }) => theme.fontSizes.xxsmall}px;
        height: ${({ theme }) => theme.fontSizes.xxsmall + 4}px;
        line-height: ${({ theme }) => theme.fontSizes.xxsmall + 4}px;
        vertical-align: middle;
        background-color: rgb(250, 129, 0);
        user-select: none;
        color: white;
        padding-left: 2px;
        padding-right: 2px;
        z-index: 3;
        transition: opacity 0.3s ease-in-out;
        white-space: nowrap;
      }
    }
  }
  .CodeMirror-scroll {
    position: relative;
    z-index: 0;
  }
  .CodeMirror-code,
  .CodeMirror-gutters {
    padding-bottom: ${({ theme }) => theme.space.xxxlarge}px;
  }
  & .file-loading-widget {
    transform: translate3d(0, -100%, 0);
  }
`

export default Editor

function resolveKeyMap(keyMap: CodeMirrorKeyMap) {
  switch (keyMap) {
    case 'vim':
      return 'vim'
    case 'default':
    default:
      return 'sublime'
  }
}
