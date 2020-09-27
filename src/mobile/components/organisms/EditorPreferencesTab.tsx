import React, {
  useCallback,
  useState,
  useMemo,
  ChangeEventHandler,
  KeyboardEventHandler,
} from 'react'
import {
  Section,
  SectionHeader,
  SectionControl,
  SectionSelect,
  SectionInput,
} from '../../../components/PreferencesModal/styled'
import { useTranslation } from 'react-i18next'
import {
  usePreferences,
  EditorIndentTypeOptions,
  EditorIndentSizeOptions,
} from '../../../lib/preferences'
import { SelectChangeEventHandler } from '../../../lib/events'
import { themes } from '../../../lib/CodeMirror'
import { capitalize } from '../../../lib/string'
import CustomizedCodeEditor from '../../../components/atoms/CustomizedCodeEditor'
import { useDebounce } from 'react-use'
import { useAnalytics, analyticsEvents } from '../../lib/analytics'
import { codeMirrorPasteHandler } from '../../../lib/eventHandler/pasteHandler'

const defaultPreviewContent = `# hello-world.js

\`\`\`js
function say() {
  console.log('Hello, World!')
}
\`\`\`
`

const EditorPreferencesTab = () => {
  const { preferences, setPreferences } = usePreferences()
  const { report } = useAnalytics()

  const selectEditorTheme: SelectChangeEventHandler = useCallback(
    (event) => {
      setPreferences({
        'editor.theme': event.target.value,
      })
      report(analyticsEvents.editorTheme)
    },
    [setPreferences, report]
  )

  const [fontSize, setFontSize] = useState(
    preferences['editor.fontSize'].toString()
  )
  const updateFontSize: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setFontSize(event.target.value)
    },
    [setFontSize]
  )
  useDebounce(
    () => {
      const parsedFontSize = parseInt(fontSize, 10)
      if (!Number.isNaN(parsedFontSize)) {
        setPreferences({
          'editor.fontSize': parsedFontSize,
        })
      }
    },
    500,
    [fontSize, setPreferences]
  )

  const [fontFamily, setFontFamily] = useState(preferences['editor.fontFamily'])
  const updateFontFamily: ChangeEventHandler<HTMLInputElement> = useCallback(
    (event) => {
      setFontFamily(event.target.value)
    },
    [setFontFamily]
  )
  useDebounce(
    () => {
      setPreferences({
        'editor.fontFamily': fontFamily,
      })
    },
    500,
    [fontFamily, setPreferences]
  )

  const selectEditorIndentType: SelectChangeEventHandler = useCallback(
    (event) => {
      setPreferences({
        'editor.indentType': event.target.value as EditorIndentTypeOptions,
      })
    },
    [setPreferences]
  )

  const selectEditorIndentSize: SelectChangeEventHandler = useCallback(
    (event) => {
      setPreferences({
        'editor.indentSize': parseInt(
          event.target.value,
          10
        ) as EditorIndentSizeOptions,
      })
    },
    [setPreferences]
  )

  const codeEditorKeydownInterceptor = useMemo<KeyboardEventHandler>(() => {
    return (event) => {
      if (event.key === 'Escape') {
        event.stopPropagation()
      }
    }
  }, [])

  const [previewContent, setPreviewContent] = useState(defaultPreviewContent)

  const { t } = useTranslation()
  return (
    <div>
      <Section>
        <SectionHeader>{t('preferences.editorTheme')}</SectionHeader>
        <SectionControl>
          <SectionSelect
            value={preferences['editor.theme']}
            onChange={selectEditorTheme}
          >
            <option value='default'>Default</option>
            {themes.map((theme) => (
              <option value={theme} key={theme}>
                {capitalize(theme)}
              </option>
            ))}
          </SectionSelect>
        </SectionControl>
      </Section>
      <Section>
        <SectionHeader>{t('preferences.editorFontSize')}</SectionHeader>
        <SectionControl>
          <SectionInput
            type='number'
            value={fontSize}
            onChange={updateFontSize}
          />{' '}
          &emsp;px
        </SectionControl>
      </Section>
      <Section>
        <SectionHeader>{t('preferences.editorFontFamily')}</SectionHeader>
        <SectionControl>
          <SectionInput
            type='value'
            value={fontFamily}
            onChange={updateFontFamily}
          />
        </SectionControl>
      </Section>
      <Section>
        <SectionHeader>{t('preferences.editorIndentType')}</SectionHeader>
        <SectionControl>
          <SectionSelect
            value={preferences['editor.indentType']}
            onChange={selectEditorIndentType}
          >
            <option value='spaces'>{t('preferences.spaces')}</option>
            <option value='tab'>{t('preferences.tab')}</option>
          </SectionSelect>
        </SectionControl>
      </Section>
      <Section>
        <SectionHeader>{t('preferences.editorIndentSize')}</SectionHeader>
        <SectionControl>
          <SectionSelect
            value={preferences['editor.indentSize']}
            onChange={selectEditorIndentSize}
          >
            <option value={2}>2</option>
            <option value={4}>4</option>
            <option value={8}>8</option>
          </SectionSelect>
        </SectionControl>
      </Section>
      <Section>
        <SectionHeader>{t('preferences.editorPreview')}</SectionHeader>
        <SectionControl onKeyDown={codeEditorKeydownInterceptor}>
          <CustomizedCodeEditor
            value={previewContent}
            onChange={(newValue) => setPreviewContent(newValue)}
            onPaste={codeMirrorPasteHandler}
          />
        </SectionControl>
      </Section>
    </div>
  )
}

export default EditorPreferencesTab
