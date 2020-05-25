import React, { useMemo, useCallback } from 'react'
import Navigator from './organisms/Navigator'
import Router from './Router'
import GlobalStyle from './GlobalStyle'
import { ThemeProvider } from 'styled-components'
import { legacyTheme } from '../themes/legacy'
import { darkTheme } from '../themes/dark'
import { lightTheme } from '../themes/light'
import { sepiaTheme } from '../themes/sepia'
import { solarizedDarkTheme } from '../themes/solarizedDark'
import ContextMenu from './organisms/ContextMenu'
import Dialog from './organisms/Dialog'
import { useDb } from '../lib/db'
import TwoPaneLayout from './atoms/TwoPaneLayout'
import PreferencesModal from './PreferencesModal/PreferencesModal'
import { useGlobalKeyDownHandler, isWithGeneralCtrlKey } from '../lib/keyboard'
import { usePreferences } from '../lib/preferences'
import '../lib/i18n'
import '../lib/analytics'
import CodeMirrorStyle from './CodeMirrorStyle'
import { useGeneralStatus } from '../lib/generalStatus'
import ToastList from './Toast'
import styled from '../lib/styled'
import { useEffectOnce } from 'react-use'
import 'react-sortable-tree/style.css'

const LoadingText = styled.div`
  margin: 30px;
`

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
`

const App = () => {
  const { initialize, initialized, queueSyncingAllStorage } = useDb()
  useEffectOnce(() => {
    initialize()
      .then(() => {
        queueSyncingAllStorage(0)
      })
      .catch((error) => {
        console.error(error)
      })
  })

  const { toggleClosed, preferences } = usePreferences()
  const keyboardHandler = useMemo(() => {
    return (event: KeyboardEvent) => {
      switch (event.key) {
        case ',':
          if (isWithGeneralCtrlKey(event)) {
            toggleClosed()
          }
      }
    }
  }, [toggleClosed])
  useGlobalKeyDownHandler(keyboardHandler)
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const updateNavWidth = useCallback(
    (leftWidth: number) => {
      setGeneralStatus({
        sideBarWidth: leftWidth,
      })
    },
    [setGeneralStatus]
  )
  return (
    <ThemeProvider theme={selectTheme(preferences['general.theme'])}>
      <AppContainer
        onDrop={(event: React.DragEvent) => {
          event.preventDefault()
        }}
      >
        {initialized ? (
          <TwoPaneLayout
            defaultLeftWidth={generalStatus.sideBarWidth}
            left={<Navigator />}
            right={<Router />}
            onResizeEnd={updateNavWidth}
          />
        ) : (
          <LoadingText>Loading Data...</LoadingText>
        )}
        <GlobalStyle />
        <ContextMenu />
        <Dialog />
        <PreferencesModal />
        <ToastList />
        <CodeMirrorStyle />
      </AppContainer>
    </ThemeProvider>
  )
}
function selectTheme(theme: string) {
  switch (theme) {
    case 'legacy':
      return legacyTheme
    case 'light':
      return lightTheme
    case 'sepia':
      return sepiaTheme
    case 'solarizedDark':
      return solarizedDarkTheme
    case 'dark':
    default:
      return darkTheme
  }
}

export default App
