import { createStoreContext } from './context'
import { useState } from 'react'

export interface FolderRearrangementStore {
  isRearranging: boolean
  startRearrangement: () => void
  endRearrangement: () => void
}

const useFolderRearrangementStore = (): FolderRearrangementStore => {
  const [isRearranging, setIsRearranging] = useState<boolean>(false)

  return {
    isRearranging,
    startRearrangement: () => setIsRearranging(true),
    endRearrangement: () => setIsRearranging(false),
  }
}

export const {
  StoreProvider: FolderRearrangementProvider,
  useStore: useFolderRearrangement,
} = createStoreContext(useFolderRearrangementStore, 'aaaa')
