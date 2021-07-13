import { useState, useCallback } from 'react'
import { createStoreContext } from '../../cloud/lib/utils/context'

function useAppStatusStore() {
  const [showingNavigator, setShowingNavigator] = useState(false)

  const toggleShowingNavigator = useCallback(() => {
    setShowingNavigator((previousValue) => {
      return !previousValue
    })
  }, [])

  return {
    showingNavigator,
    setShowingNavigator,
    toggleShowingNavigator,
  }
}

export const {
  StoreProvider: AppStatusProvider,
  useStore: useAppStatus,
} = createStoreContext(useAppStatusStore, 'appStatus')
