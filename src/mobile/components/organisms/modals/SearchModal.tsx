import React, { useState, useCallback, useMemo } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { useDebounce } from 'react-use'
import { useSearch } from '../../../../cloud/lib/stores/search'
import { useRouter } from '../../../../cloud/lib/router'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { getFolderHref, getDocLinkHref } from '../../../lib/href'
import {
  SidebarSearchHistory,
  SidebarSearchResult,
} from '../../../../shared/components/organisms/Sidebar/molecules/SidebarSearch'
import useApi from '../../../../shared/lib/hooks/useApi'
import {
  GetSearchResultsRequestQuery,
  getSearchResultsV2,
  HistoryItem,
  SearchResult,
} from '../../../../cloud/api/search'
import { SerializedDoc } from '../../../../cloud/interfaces/db/doc'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import { getDocTitle } from '../../../../cloud/lib/utils/patterns'
import { mdiFileDocumentOutline } from '@mdi/js'
import { SerializedFolder } from '../../../../cloud/interfaces/db/folder'
import SidebarSearch from '../../../../shared/components/organisms/Sidebar/molecules/SidebarSearch'
import ModalContainer from './atoms/ModalContainer'

const SearchModal = () => {
  const { docsMap, foldersMap } = useNav()
  const { team } = usePage()
  const { push } = useRouter()
  const { history, searchHistory, addToSearchHistory } = useSearch()
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const [searchResults, setSearchResults] = useState<SidebarSearchResult[]>([])

  const historyItems = useMemo(() => {
    return mapHistory(history || [], push, docsMap, foldersMap, team)
  }, [team, history, push, docsMap, foldersMap])

  const setSearchQuery = useCallback((val: string) => {
    setSidebarSearchQuery(val)
  }, [])

  const { submit: submitSearch, sending: fetchingSearchResults } = useApi({
    api: ({ teamId, query }: { teamId: string; query: any }) =>
      getSearchResultsV2({ teamId, query }),
    cb: ({ results }) =>
      setSearchResults(mapSearchResults(results, push, team)),
  })

  const [isNotDebouncing, cancel] = useDebounce(
    async () => {
      if (team == null || sidebarSearchQuery.trim() === '') {
        return
      }

      if (fetchingSearchResults) {
        cancel()
      }

      const searchParams = sidebarSearchQuery
        .split(' ')
        .reduce<GetSearchResultsRequestQuery>(
          (params, str) => {
            if (str === '--body') {
              params.body = true
              return params
            }
            if (str === '--title') {
              params.title = true
              return params
            }
            params.query = params.query == '' ? str : `${params.query} ${str}`
            return params
          },
          { query: '' }
        )

      addToSearchHistory(searchParams.query)
      await submitSearch({ teamId: team.id, query: searchParams })
    },
    600,
    [sidebarSearchQuery]
  )

  const sidebarSearchState = useMemo(() => {
    return {
      fetching: fetchingSearchResults,
      isNotDebouncing: isNotDebouncing() === true,
    }
  }, [isNotDebouncing, fetchingSearchResults])

  return (
    <ModalContainer title='Search' closeLabel='Done'>
      <SidebarSearch
        recentlySearched={searchHistory}
        recentlyVisited={historyItems}
        searchQuery={sidebarSearchQuery}
        setSearchQuery={setSearchQuery}
        searchResults={searchResults}
        searchState={sidebarSearchState}
      />
    </ModalContainer>
  )
}

export default SearchModal

function mapSearchResults(
  results: SearchResult[],
  push: (url: string) => void,
  team?: SerializedTeam
) {
  if (team == null) {
    return []
  }

  return results.reduce((acc, item) => {
    if (item.type === 'folder') {
      const href = `${process.env.BOOST_HUB_BASE_URL}${getFolderHref(
        item.result,
        team,
        'index'
      )}`
      acc.push({
        label: item.result.name,
        href,
        emoji: item.result.emoji,
        onClick: () => push(href),
      })
      return acc
    }

    const href = `${process.env.BOOST_HUB_BASE_URL}${getDocLinkHref(
      item.result,
      team,
      'index'
    )}`
    acc.push({
      label: getDocTitle(item.result, 'Untitled'),
      href,
      defaultIcon: mdiFileDocumentOutline,
      emoji: item.result.emoji,
      contexts: item.type === 'docContent' ? [item.context] : undefined,
      onClick: () => push(href),
    })
    return acc
  }, [] as SidebarSearchResult[])
}

function mapHistory(
  history: HistoryItem[],
  push: (href: string) => void,
  docsMap: Map<string, SerializedDoc>,
  foldersMap: Map<string, SerializedFolder>,
  team?: SerializedTeam
) {
  if (team == null) {
    return []
  }

  const items = [] as SidebarSearchHistory[]

  history.forEach((historyItem) => {
    if (historyItem.type === 'folder') {
      const item = foldersMap.get(historyItem.item)
      if (item != null) {
        const href = `${process.env.BOOST_HUB_BASE_URL}${getFolderHref(
          item,
          team,
          'index'
        )}`
        items.push({
          emoji: item.emoji,
          label: item.name,
          href,
          onClick: () => push(href),
        })
      }
    } else {
      const item = docsMap.get(historyItem.item)
      if (item != null) {
        const href = `${process.env.BOOST_HUB_BASE_URL}${getDocLinkHref(
          item,
          team,
          'index'
        )}`
        items.push({
          emoji: item.emoji,
          defaultIcon: mdiFileDocumentOutline,
          label: getDocTitle(item, 'Untitled'),
          href,
          onClick: () => push(href),
        })
      }
    }
  })

  return items
}
