import React, { useCallback } from 'react'
import { usePreferences } from '../../lib/preferences'
import { openContextMenu } from '../../lib/electronOnly'
import { MenuItemConstructorOptions } from 'electron'
import { capitalize } from '../../lib/string'
import BottomBarButton from '../atoms/BottomBarButton'
import { useTranslation } from 'react-i18next'

const EditorIndentationStatus = () => {
  const { preferences, setPreferences } = usePreferences()
  const currentIndentType = preferences['editor.indentType']
  const currentIndentSize = preferences['editor.indentSize']
  const { t } = useTranslation()

  const openEditorIndentationContextMenu = useCallback(() => {
    openContextMenu({
      menuItems: [
        {
          type: 'submenu',
          label: `Indent Size: ${capitalize(currentIndentType)}`,
          submenu: [
            {
              type: 'radio',
              label: 'Spaces',
              checked: currentIndentType === 'spaces',
              click: () => {
                setPreferences({
                  'editor.indentType': 'spaces',
                })
              },
            },
            {
              type: 'normal',
              label: 'Tab',
              checked: currentIndentType === 'tab',
              click: () => {
                setPreferences({
                  'editor.indentType': 'tab',
                })
              },
            },
          ] as MenuItemConstructorOptions[],
        },
        {
          type: 'submenu',
          label: `Indent Size: ${currentIndentSize}`,
          submenu: ([2, 4, 8] as [2, 4, 8]).map((indentSize) => {
            return {
              type: 'radio',
              label: `${indentSize}`,
              checked: currentIndentSize === indentSize,
              click: () => {
                setPreferences({
                  'editor.indentSize': indentSize,
                })
              },
            }
          }) as MenuItemConstructorOptions[],
        },
      ] as MenuItemConstructorOptions[],
    })
  }, [currentIndentType, currentIndentSize, setPreferences])

  return (
    <BottomBarButton
      tooltipText={t('editor.editorIndentStatus')}
      onClick={openEditorIndentationContextMenu}
    >
      {capitalize(currentIndentType)}: {currentIndentSize}
    </BottomBarButton>
  )
}

export default EditorIndentationStatus
