import React from 'react'
import CodeEditor from './CodeEditor'
import { usePreferences, Keybinding } from '../../lib/preferences'

interface CustomizedCodeEditorProps {
  value: string
  onChange?: (
    newValue: string,
    change: CodeMirror.EditorChangeLinkedList
  ) => void
  codeMirrorRef?: (codeMirror: CodeMirror.EditorFromTextArea) => void
  className?: string
  mode?: string
  readonly?: boolean
}

type KeybindingMap = {[key: string]: Keybinding};

const CustomizedCodeEditor = ({
  onChange,
  value,
  codeMirrorRef,
  className,
  mode,
  readonly,
}: CustomizedCodeEditorProps) => {
  const { preferences } = usePreferences()
  const keybindings: KeybindingMap = Object.keys(preferences).reduce((acc, key) => {
    if (key.startsWith("keybinding")) {
      acc[key] = preferences[key];
    }
    return acc;
  }, {} as KeybindingMap);
  return (
    <CodeEditor
      onChange={onChange}
      value={value}
      codeMirrorRef={codeMirrorRef}
      className={className}
      theme={preferences['editor.theme']}
      fontSize={preferences['editor.fontSize']}
      fontFamily={preferences['editor.fontFamily']}
      indentType={preferences['editor.indentType']}
      indentSize={preferences['editor.indentSize']}
      keyMap={preferences['editor.keyMap']}
      keybindings={keybindings}
      mode={mode}
      readonly={readonly}
    />
  )
}
export default CustomizedCodeEditor
