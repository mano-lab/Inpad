import React from 'react'
import CodeMirror, { getCodeMirrorTheme } from '../../lib/CodeMirror'
import styled from '../../lib/styled'
import { borderRight } from '../../lib/styled/styleFunctions'
import {
  EditorIndentTypeOptions,
  EditorIndentSizeOptions,
  EditorKeyMapOptions,
} from '../../lib/preferences'
import { osName } from '../../lib/platform'

const StyledContainer = styled.div`
  .CodeMirror {
    font-family: inherit;
  }

  .CodeMirror-dialog button {
    background-color: transparent;
    cursor: pointer;
    height: 26px;
    line-height: 26px;
    padding: 0 15px;
    transition: color 200ms ease-in-out;
    color: ${({ theme }) => theme.primaryDarkerColor};
    border: none;
    ${borderRight}
    &:last-child {
      border-right: none;
    }
  }

  .CodeMirror-dialog button:hover {
    color: ${({ theme }) => theme.primaryButtonLabelColor};
    background-color: ${({ theme }) => theme.primaryColor};
  }

  .CodeMirror-hyperlink {
    cursor: pointer;
  }

  .CodeMirror-hover {
    padding: 2px 4px 0 4px;
    position: absolute;
    z-index: 99;
  }
`

const defaultCodeMirrorOptions: CodeMirror.EditorConfiguration = {
  lineWrapping: true,
  lineNumbers: true,
}

interface CodeEditorProps {
  value: string
  onChange?: (
    newValue: string,
    change: CodeMirror.EditorChangeLinkedList
  ) => void
  codeMirrorRef?: (codeMirror: CodeMirror.EditorFromTextArea) => void
  className?: string
  theme?: string
  fontSize?: number
  fontFamily?: string
  indentType?: EditorIndentTypeOptions
  indentSize?: EditorIndentSizeOptions
  keyMap?: EditorKeyMapOptions
  mode?: string
  readonly?: boolean
  onPaste?: (codeMirror: CodeMirror.Editor, event: ClipboardEvent) => void
  onDrop?: (codeMirror: CodeMirror.Editor, event: DragEvent) => void
  onCursorActivity?: (codeMirror: CodeMirror.Editor) => void
}

class CodeEditor extends React.Component<CodeEditorProps> {
  textAreaRef = React.createRef<HTMLTextAreaElement>()
  codeMirror?: CodeMirror.EditorFromTextArea

  componentDidMount() {
    const indentSize = this.props.indentSize == null ? 2 : this.props.indentSize
    const keyMap =
      this.props.keyMap == null || this.props.keyMap === 'default'
        ? 'sublime'
        : this.props.keyMap
    this.codeMirror = CodeMirror.fromTextArea(this.textAreaRef.current!, {
      ...defaultCodeMirrorOptions,
      theme: getCodeMirrorTheme(this.props.theme),
      indentWithTabs: this.props.indentType === 'tab',
      indentUnit: indentSize,
      tabSize: indentSize,
      keyMap,
      mode: this.props.mode || 'gfm',
      readOnly: this.props.readonly === true,
      extraKeys: {
        Enter: 'newlineAndIndentContinueMarkdownList',
        Tab: 'indentMore',
        [osName === 'macos' ? 'Cmd-Alt-F' : 'Ctrl-Alt-F']: 'findPersistent',
        Esc: 'clearSearch',
      },
      scrollPastEnd: true,
    })
    this.codeMirror.on('change', this.handleCodeMirrorChange)
    window.addEventListener('codemirror-mode-load', this.reloadMode)
    if (this.props.codeMirrorRef != null) {
      this.props.codeMirrorRef(this.codeMirror)
    }
    this.codeMirror.on('paste', this.handlePaste as any)
    this.codeMirror.on('drop', this.handleDrop)
    this.codeMirror.on('cursorActivity', this.handleCursorActivity)
  }

  reloadMode = () => {
    if (this.codeMirror != null) {
      this.codeMirror.setOption('mode', this.codeMirror.getOption('mode'))
    }
  }

  componentDidUpdate(prevProps: CodeEditorProps) {
    if (this.codeMirror == null) {
      return
    }
    if (this.props.value !== this.codeMirror.getValue()) {
      this.codeMirror.setValue(this.props.value)
    }
    if (this.props.theme !== prevProps.theme) {
      this.codeMirror.setOption('theme', getCodeMirrorTheme(this.props.theme))
    }
    if (
      this.props.fontSize !== prevProps.fontSize ||
      this.props.fontFamily !== prevProps.fontFamily
    ) {
      this.codeMirror.refresh()
    }
    if (this.props.indentType !== prevProps.indentType) {
      this.codeMirror.setOption(
        'indentWithTabs',
        this.props.indentType === 'tab'
      )
    }
    if (this.props.indentSize !== prevProps.indentSize) {
      const indentSize =
        this.props.indentSize == null ? 2 : this.props.indentSize
      this.codeMirror.setOption('indentUnit', indentSize)
      this.codeMirror.setOption('tabSize', indentSize)
    }
    if (this.props.keyMap !== prevProps.keyMap) {
      const keyMap =
        this.props.keyMap == null || this.props.keyMap === 'default'
          ? 'sublime'
          : this.props.keyMap
      this.codeMirror.setOption('keyMap', keyMap)
    }
  }

  componentWillUnmount() {
    if (this.codeMirror != null) {
      this.codeMirror.toTextArea()
      this.codeMirror.off('paste', this.handlePaste as any)
      this.codeMirror.off('drop', this.handleDrop)
      this.codeMirror.off('cursorActivity', this.handleCursorActivity)
    }
    window.removeEventListener('codemirror-mode-load', this.reloadMode)
  }

  handlePaste = (editor: CodeMirror.Editor, event: ClipboardEvent) => {
    const { onPaste } = this.props
    if (onPaste == null) {
      return
    }

    onPaste(editor, event)
  }

  handleDrop = (editor: CodeMirror.Editor, event: DragEvent) => {
    const { onDrop } = this.props
    if (onDrop == null) {
      return
    }

    onDrop(editor, event)
  }

  handleCodeMirrorChange = (
    editor: CodeMirror.Editor,
    change: CodeMirror.EditorChangeLinkedList
  ) => {
    if (change.origin !== 'setValue' && this.props.onChange != null) {
      this.props.onChange(editor.getValue(), change)
    }
  }

  handleCursorActivity = (editor: CodeMirror.Editor) => {
    if (this.props.onCursorActivity != null) {
      this.props.onCursorActivity(editor)
    }
  }

  render() {
    const { fontSize, fontFamily, value, className } = this.props

    return (
      <StyledContainer
        className={className}
        style={{
          fontSize: fontSize == null ? 'inherit' : `${fontSize}px`,
          fontFamily: fontFamily == null ? 'monospace' : fontFamily,
        }}
      >
        <textarea ref={this.textAreaRef} defaultValue={value} />
      </StyledContainer>
    )
  }
}

export default CodeEditor
