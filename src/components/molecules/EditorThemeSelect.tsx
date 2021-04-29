import React, { useCallback } from 'react'
import { usePreferences } from '../../lib/preferences'
import { openContextMenu } from '../../lib/electronOnly'
import { MenuItemConstructorOptions } from 'electron'
import BottomBarButton from '../atoms/BottomBarButton'
import Icon from '../atoms/Icon'
import { mdiPaletteOutline } from '@mdi/js'
import { themes } from '../../lib/CodeMirror'
import { useTranslation } from 'react-i18next'

const EditorThemeSelect = () => {
  const { preferences, setPreferences } = usePreferences()
  const editorTheme = preferences['editor.theme']
  const codeBlockTheme = preferences['markdown.codeBlockTheme']
  const { t } = useTranslation()

  const openThemeContextMenu = useCallback(() => {
    openContextMenu({
      menuItems: [
        {
          type: 'submenu',
          label: `Editor Theme: ${editorTheme}`,
          submenu: themes.map((theme) => {
            return {
              type: 'radio',
              label: theme,
              checked: editorTheme === theme,
              click: () => {
                setPreferences({ 'editor.theme': theme })
              },
            } as MenuItemConstructorOptions
          }),
        },
        {
          type: 'submenu',
          label: `Markdown Code Block Theme: ${codeBlockTheme}`,
          submenu: themes.map((theme) => {
            return {
              type: 'radio',
              label: theme,
              checked: codeBlockTheme === theme,
              click: () => {
                setPreferences({ 'markdown.codeBlockTheme': theme })
              },
            } as MenuItemConstructorOptions
          }),
        },
      ] as MenuItemConstructorOptions[],
    })
  }, [editorTheme, codeBlockTheme, setPreferences])

  return (
    <BottomBarButton
      tooltipText={t('editor.editorThemeSelect')}
      onClick={openThemeContextMenu}
    >
      <Icon path={mdiPaletteOutline} />
    </BottomBarButton>
  )
}

export default EditorThemeSelect
