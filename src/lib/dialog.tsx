import { useState, useCallback } from 'react'
import { createStoreContext } from './context'

export enum DialogTypes {
  Prompt = 'Prompt',
  MessageBox = 'MessageBox',
  FolderConfig = 'FolderConfig',
}

export enum DialogIconTypes {
  Question = 'Question',
  Info = 'Info',
  Error = 'Error',
  Warning = 'Warning',
}

export interface BaseDialogOptions {
  title: string
  message: string
  iconType: DialogIconTypes
}

export type MessageBoxDialogOptions = BaseDialogOptions & {
  buttons: string[]
  defaultButtonIndex?: number
  cancelButtonIndex?: number
  onClose: (value: number | null) => void
}

export type PromptDialogOptions = BaseDialogOptions & {
  defaultValue?: string
  submitButtonLabel?: string
  cancelButtonLabel?: string
  onClose: (value: string | null) => void
}

export type FolderConfigDialogOptions = BaseDialogOptions & {
  defaultValue?: FolderConfigDialogValues
  submitButtonLabel?: string
  cancelButtonLabel?: string
  onClose: (value: FolderConfigDialogValues | null) => void
}

export type FolderConfigDialogValues = {
  folderPath?: string
  color: string
}

export interface BaseDialogData {
  id: number
  type: DialogTypes
  title: string
  message: string
  iconType: DialogIconTypes
}

export type MessageBoxDialogData = BaseDialogData &
  MessageBoxDialogOptions & {
    type: DialogTypes.MessageBox
  }
export type PromptDialogData = BaseDialogData &
  PromptDialogOptions & {
    type: DialogTypes.Prompt
  }
export type FolderConfigDialogData = BaseDialogData &
  FolderConfigDialogOptions & {
    type: DialogTypes.FolderConfig
  }

export type DialogData =
  | MessageBoxDialogData
  | PromptDialogData
  | FolderConfigDialogData

export interface DialogContext {
  data: DialogData | null
  prompt(options: PromptDialogOptions): void
  messageBox(options: MessageBoxDialogOptions): void
  folderConfig(options: FolderConfigDialogOptions): void
  closeDialog(): void
}

let id = 0

function useDialogStore(): DialogContext {
  const [data, setData] = useState<DialogData | null>(null)
  const prompt = useCallback((options: PromptDialogOptions) => {
    setData({
      id: id++,
      type: DialogTypes.Prompt,
      ...options,
    })
  }, [])
  const messageBox = useCallback((options: MessageBoxDialogOptions) => {
    setData({
      id: id++,
      type: DialogTypes.MessageBox,
      ...options,
    })
  }, [])
  const folderConfig = useCallback((options: FolderConfigDialogOptions) => {
    setData({
      id: id++,
      type: DialogTypes.FolderConfig,
      ...options,
    })
  }, [])
  const closeDialog = useCallback(() => {
    setData(null)
  }, [])

  return {
    data,
    prompt,
    messageBox,
    folderConfig,
    closeDialog,
  }
}

export const {
  StoreProvider: DialogProvider,
  useStore: useDialog,
} = createStoreContext(useDialogStore, 'dialog')
