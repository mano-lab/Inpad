import React, { ChangeEventHandler, EventHandler } from 'react'

export type SelectChangeEventHandler = ChangeEventHandler<HTMLSelectElement>
export type ButtonClickEventHandler = EventHandler<React.MouseEvent>

function createCustomEventEmitter(
  name: string
): {
  dispatch: () => void
  listen: (handler: (event: CustomEvent) => void) => void
  unlisten: (handler: (event: CustomEvent) => void) => void
}
function createCustomEventEmitter<D = any>(
  name: string
): {
  dispatch: (detail: D) => void
  listen: (handler: (event: CustomEvent<D>) => void) => void
  unlisten: (handler: (event: CustomEvent<D>) => void) => void
}
function createCustomEventEmitter<D = any>(name: string) {
  return {
    dispatch(detail: D) {
      window.dispatchEvent(new CustomEvent(name, { detail }))
    },
    listen(handler: (event: CustomEvent<D>) => void) {
      window.addEventListener(name, handler as (event: Event) => void)
    },
    unlisten(handler: (event: CustomEvent<D>) => void) {
      window.removeEventListener(name, handler as (event: Event) => void)
    },
  }
}

export const toggleSettingsEventEmitter = createCustomEventEmitter(
  'toggle-settings'
)

export const newNoteEventEmitter = createCustomEventEmitter('new-note')

export const newFolderEventEmitter = createCustomEventEmitter('new-folder')

export const searchEventEmitter = createCustomEventEmitter('search')

export const toggleSideNavigatorEventEmitter = createCustomEventEmitter(
  'toggle-side-navigator'
)

export const focusTitleEventEmitter = createCustomEventEmitter('focus-title')

export const focusEditorEventEmitter = createCustomEventEmitter('focus-editor')

export const focusEditorHeadingEventEmitter = createCustomEventEmitter<{
  heading: string
}>('focus-editor-location')

export const togglePreviewModeEventEmitter = createCustomEventEmitter(
  'toggle-preview-mode'
)

export const toggleSplitEditModeEventEmitter = createCustomEventEmitter(
  'toggle-split-edit-mode'
)

export const applyBoldStyleEventEmitter = createCustomEventEmitter(
  'apply-bold-style'
)

export const applyItalicStyleEventEmitter = createCustomEventEmitter(
  'apply-italic-style'
)

export const toggleSidebarSearchEventEmitter = createCustomEventEmitter(
  'sidebar-search'
)

export const toggleSidebarNotificationsEventEmitter = createCustomEventEmitter(
  'sidebar-notifications'
)

export const toggleSettingsMembersEventEmitter = createCustomEventEmitter(
  'toggle-settings-members'
)
