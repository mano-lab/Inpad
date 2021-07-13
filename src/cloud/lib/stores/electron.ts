import { createStoreContext } from '../utils/context'
import {
  toggleSettingsEventEmitter,
  newNoteEventEmitter,
  newFolderEventEmitter,
  searchEventEmitter,
  toggleSideNavigatorEventEmitter,
  focusTitleEventEmitter,
  focusEditorEventEmitter,
  togglePreviewModeEventEmitter,
  toggleSplitEditModeEventEmitter,
  applyBoldStyleEventEmitter,
  applyItalicStyleEventEmitter,
  toggleSettingsMembersEventEmitter,
  toggleSidebarSearchEventEmitter,
  toggleSidebarNotificationsEventEmitter,
} from '../utils/events'
import { useGlobalKeyDownHandler, isWithGeneralCtrlKey } from '../keyboard'
import { IpcRendererEvent } from 'electron'
import { useEffectOnce } from 'react-use'
import ltSemver from 'semver/functions/lt'

export function sendToHost(channel: string, ...args: any[]) {
  ;(window as any).__ELECTRON_ONLY__.sendToHost(channel, ...args)
}
function addHostListener(channel: string, listener: (...args: any[]) => void) {
  ;(window as any).__ELECTRON_ONLY__.addHostListener(channel, listener)
}
function addHostListenerOnce(
  channel: string,
  listner: (...args: any[]) => void
) {
  ;(window as any).__ELECTRON_ONLY__.addHostListenerOnce(channel, listner)
}
function removeAllHostListeners(channel?: string) {
  ;(window as any).__ELECTRON_ONLY__.removeAllHostListeners(channel)
}

export const globalContextMenuIsConfigured = !!(window as any).__ELECTRON_ONLY__
  ?.globalContextMenuIsConfigured

export const usingElectron = /Cloud Space/.test(navigator.userAgent)

export function getCurrentDesktopAppVersion() {
  const matchResult = / ([^\s]+) Cloud Space/.exec(navigator.userAgent)
  if (matchResult == null) {
    return null
  }
  return matchResult[1]
}

const currentDesktopAppVersion = getCurrentDesktopAppVersion()
export const usingLegacyElectron =
  currentDesktopAppVersion != null
    ? ltSemver(currentDesktopAppVersion, '0.20.0')
    : false

export function openInBrowser(url: string) {
  if (!usingElectron) {
    console.warn('openInBrowser is not supported in web app')
    return
  }
  ;(window as any).__ELECTRON_ONLY__.openInBrowser(url)
}

let accessTokenHasBeenInitialized = false
let accessToken: string | null = null
export function setAccessToken(newAccessToken: string | null) {
  if (!accessTokenHasBeenInitialized) {
    accessTokenHasBeenInitialized = true
  }
  accessToken = newAccessToken
}

export function initAccessToken(): Promise<string | null> {
  return new Promise((resolve, _reject) => {
    if (accessTokenHasBeenInitialized) {
      resolve(accessToken)
      return
    }
    if (!usingElectron) {
      accessTokenHasBeenInitialized = true
      resolve(accessToken)
      return
    }
    sendToHost('request-access-token')
    addHostListenerOnce(
      'update-access-token',
      (_event: IpcRendererEvent, accessToken: string) => {
        accessTokenHasBeenInitialized = true
        setAccessToken(accessToken)
        resolve(accessToken)
      }
    )
  })
}

export function getAccessToken(): string | null {
  if (accessTokenHasBeenInitialized) {
    return accessToken
  }
  throw new Error('AccessToken has not been initialized yet.')
}

interface PrintToPDFOptions {
  headerFooter?: Record<string, string>
  landscape?: boolean
  marginsType?: number
  scaleFactor?: number
  pageRanges?: Record<string, number>
  pageSize?: string | { height: number; width: number }
  printBackground?: boolean
  printSelectionOnly?: boolean
}

function convertHtmlStringToPdfBlob(
  htmlString: string,
  printOptions: PrintToPDFOptions
): Promise<Blob> {
  return (window as any).__ELECTRON_ONLY__.convertHtmlStringToPdfBlob(
    htmlString,
    printOptions
  )
}

interface ElectronStore {
  usingElectron: boolean
  sendToElectron: (channel: string, ...args: any[]) => void
  convertHtmlStringToPdfBlob: (
    htmlString: string,
    printOptions: PrintToPDFOptions
  ) => Promise<Blob>
}

const useElectronStore = (): ElectronStore => {
  useEffectOnce(() => {
    if (!usingElectron) {
      return
    }

    addHostListener('toggle-sidebar-search', () => {
      toggleSidebarSearchEventEmitter.dispatch()
    })
    addHostListener('toggle-sidebar-notifications', () => {
      toggleSidebarNotificationsEventEmitter.dispatch()
    })
    addHostListener('toggle-settings-members', () => {
      toggleSettingsMembersEventEmitter.dispatch()
    })
    addHostListener('toggle-settings', () => {
      toggleSettingsEventEmitter.dispatch()
    })
    addHostListener('new-note', () => {
      newNoteEventEmitter.dispatch()
    })
    addHostListener('new-folder', () => {
      newFolderEventEmitter.dispatch()
    })
    addHostListener('search', () => {
      searchEventEmitter.dispatch()
    })
    addHostListener('toggle-side-navigator', () => {
      toggleSideNavigatorEventEmitter.dispatch()
    })
    addHostListener('focus-title', () => {
      focusTitleEventEmitter.dispatch()
    })
    addHostListener('focus-editor', () => {
      focusEditorEventEmitter.dispatch()
    })
    addHostListener('toggle-preview-mode', () => {
      togglePreviewModeEventEmitter.dispatch()
    })
    addHostListener('toggle-split-edit-mode', () => {
      toggleSplitEditModeEventEmitter.dispatch()
    })
    addHostListener('apply-bold-style', () => {
      applyBoldStyleEventEmitter.dispatch()
    })
    addHostListener('apply-italic-style', () => {
      applyItalicStyleEventEmitter.dispatch()
    })
    addHostListener(
      'update-access-token',
      (_event: IpcRendererEvent, accessToken: string | null) => {
        if (!accessTokenHasBeenInitialized) {
          accessTokenHasBeenInitialized = true
        }
        setAccessToken(accessToken)
      }
    )

    return () => {
      removeAllHostListeners()
    }
  })

  useGlobalKeyDownHandler((event) => {
    if (usingElectron) {
      return
    }
    if (!isWithGeneralCtrlKey(event)) {
      return
    }
    switch (event.key) {
      case ',':
        event.preventDefault()
        toggleSettingsEventEmitter.dispatch()
        return
      case 'p':
        event.preventDefault()
        searchEventEmitter.dispatch()
        return
      case '0':
        if (event.shiftKey) {
          event.preventDefault()
          toggleSideNavigatorEventEmitter.dispatch()
        }
        return
      case 'j':
        event.preventDefault()
        if (event.shiftKey) {
          focusTitleEventEmitter.dispatch()
        } else {
          focusEditorEventEmitter.dispatch()
        }
        return
      case 'e':
        event.preventDefault()
        togglePreviewModeEventEmitter.dispatch()
        return
      case '\\':
        event.preventDefault()
        toggleSplitEditModeEventEmitter.dispatch()
        return
      case 'b':
        event.preventDefault()
        applyBoldStyleEventEmitter.dispatch()
        return
      case 'i':
        event.preventDefault()
        applyItalicStyleEventEmitter.dispatch()
        return
    }
  })

  return {
    usingElectron,
    sendToElectron: sendToHost,
    convertHtmlStringToPdfBlob,
  }
}

export const {
  StoreProvider: ElectronProvider,
  useStore: useElectron,
} = createStoreContext(useElectronStore)
