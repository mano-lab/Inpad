import { useState, useCallback, useEffect } from 'react'
import { localLiteStorage } from 'ltstrg'
import { searchKey, searchHistoryKey } from '../../localStorageKeys'
import { HistoryItem } from '../search'
import { SearchContext } from '../types'
import { useActiveStorageId } from '../../routeParams'
import { FolderDoc, NoteDoc } from '../../db/types'
import { createStoreContext } from '../../../shared/lib/utils/context'

const recentPagesLimit = 7
const historySearchLimit = 8

type LocallyStoredHistoryProps = {
  [workspaceId: string]: HistoryItem[]
}

type LocallyStoredSearchHistoryProps = {
  [workspaceId: string]: string[]
}

function useSearchStore(): SearchContext {
  const [history, setHistory] = useState<HistoryItem[]>([])
  const [searchHistory, setSearchHistory] = useState<string[]>([])
  const workspaceId = useActiveStorageId()

  const addToSearchHistory = useCallback((newSearch: string) => {
    if (newSearch.trim() === '') {
      return
    }
    return setSearchHistory((prev) => {
      const old =
        prev != null
          ? prev.filter((prevItem) => prevItem.trim() !== newSearch.trim())
          : []
      return [newSearch, ...old].slice(0, historySearchLimit)
    })
  }, [])

  const addVisitedToHistory = useCallback((item: NoteDoc | FolderDoc) => {
    let historyItem: HistoryItem
    if (/^note:/.test(item._id)) {
      historyItem = {
        type: 'doc',
        item: item._id,
      }
    } else {
      historyItem = { type: 'folder', item: item._id }
    }

    setHistory((prevHistory = []) => {
      const newHistory = [...prevHistory]
        .filter((val) => val.item !== historyItem.item)
        .slice(0, recentPagesLimit - 1)

      newHistory.unshift(historyItem)
      return newHistory
    })
  }, [])

  // LOAD FROM LOCAL STORAGE
  useEffect(() => {
    if (workspaceId == null) {
      return
    }
    try {
      const stringifiedData = localLiteStorage.getItem(searchKey)
      if (stringifiedData == null) {
        return
      }
      const locallyStoredDatas = JSON.parse(
        stringifiedData
      ) as LocallyStoredHistoryProps
      const locallyStoredIds = locallyStoredDatas[workspaceId]
      setHistory(locallyStoredIds)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error.message)
    }

    try {
      const stringifiedSearchData = localLiteStorage.getItem(searchHistoryKey)
      if (stringifiedSearchData == null) {
        return
      }
      const locallyStoredSearchData = JSON.parse(
        stringifiedSearchData
      ) as LocallyStoredSearchHistoryProps
      const locallyStoredResults = locallyStoredSearchData[workspaceId]
      setSearchHistory(locallyStoredResults)
    } catch (error) {
      // eslint-disable-next-line no-console
      console.warn(error.message)
    }
  }, [workspaceId])

  // SAVE CHANGES TO LOCALSTORAGE
  useEffect(() => {
    if (workspaceId == null) {
      return
    }
    let baseData = localLiteStorage.getItem(searchKey)
    if (baseData == null) {
      baseData = '{}'
    }
    const data = JSON.parse(baseData)
    data[workspaceId] = history
    localLiteStorage.setItem(searchKey, JSON.stringify(data))
  }, [history, workspaceId])

  useEffect(() => {
    if (workspaceId == null) {
      return
    }
    let baseData = localLiteStorage.getItem(searchHistoryKey)
    if (baseData == null) {
      baseData = '{}'
    }
    const data = JSON.parse(baseData)
    data[workspaceId] = searchHistory
    localLiteStorage.setItem(searchHistoryKey, JSON.stringify(data))
  }, [searchHistory, workspaceId])

  return {
    history,
    searchHistory,
    addToSearchHistory,
    addVisitedToHistory,
  }
}

export const {
  StoreProvider: LocalSpaceSidebarSearchProvider,
  useStore: useSidebarSearch,
} = createStoreContext(useSearchStore, 'localSpaceSidebarSearch')
