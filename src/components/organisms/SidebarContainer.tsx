import React, { useCallback, useEffect, useMemo, useState } from 'react'
import { useRouter } from '../../lib/router'
import { useDb } from '../../lib/db'
import { usePreferences } from '../../lib/preferences'
import { NoteStorage } from '../../lib/db/types'
import {
  openContextMenu,
  addIpcListener,
  removeIpcListener,
} from '../../lib/electronOnly'
import { getTimelineHref, values } from '../../lib/db/utils'
import { MenuItemConstructorOptions } from 'electron'
import { useStorageRouter } from '../../lib/storageRouter'
import {
  BoostHubTeamsShowRouteParams,
  StorageNotesRouteParams,
  StorageTagsRouteParams,
  useRouteParams,
} from '../../lib/routeParams'
import { mdiLogin, mdiLogout, mdiMenu, mdiPlus } from '@mdi/js'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { useTranslation } from 'react-i18next'
import { useSearchModal } from '../../lib/searchModal'
import styled from '../../shared/lib/styled'
import Sidebar from '../../shared/components/organisms/Sidebar'
import cc from 'classcat'
import { SidebarState } from '../../shared/lib/sidebar'
import { MenuTypes, useContextMenu } from '../../shared/lib/stores/contextMenu'
import { SidebarToolbarRow } from '../../shared/components/organisms/Sidebar/molecules/SidebarToolbar'
import { mapToolbarRows } from '../../lib/v2/mappers/local/sidebarRows'
import { useGeneralStatus } from '../../lib/generalStatus'
import { mapHistory } from '../../lib/v2/mappers/local/sidebarHistory'
import { SidebarSearchResult } from '../../shared/components/organisms/Sidebar/molecules/SidebarSearch'
import { AppUser } from '../../shared/lib/mappers/users'
import useApi from '../../shared/lib/hooks/useApi'
import { useDebounce } from 'react-use'
import {
  GetSearchResultsRequestQuery,
  NoteSearchData,
} from '../../lib/search/search'
import {
  getSearchResultItems,
  mapSearchResults,
} from '../../lib/v2/mappers/local/searchResults'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import {
  mapTree,
  SidebarTreeSortingOrders,
} from '../../lib/v2/mappers/local/sidebarTree'
import { useLocalDB } from '../../lib/v2/hooks/local/useLocalDB'
import { useLocalDnd } from '../../lib/v2/hooks/local/useLocalDnd'
import { CollapsableType } from '../../lib/v2/stores/sidebarCollapse'
import { useSidebarCollapse } from '../../lib/v2/stores/sidebarCollapse'
import { useCloudIntroModal } from '../../lib/cloudIntroModal'
import { mapLocalSpace } from '../../lib/v2/mappers/local/sidebarSpaces'
import { osName } from '../../shared/lib/platform'
import { mapTimelineItems } from '../../lib/v2/mappers/local/timelineRows'
import {
  SidebarSpace,
  SidebarSpaceContentRow,
} from '../../shared/components/organisms/Sidebar/molecules/SidebarSpaces'
import { useBoostHub } from '../../lib/boosthub'
import NewDocButton from '../molecules/NewDocButton'
import { useSidebarSearch } from '../../lib/search/stores/store'

interface SidebarContainerProps {
  hideSidebar?: boolean
  initialSidebarState?: SidebarState
  workspace?: NoteStorage
}

const SidebarContainer = ({
  initialSidebarState,
  workspace,
  hideSidebar,
}: SidebarContainerProps) => {
  const { createNote, storageMap } = useDb()
  const { push, hash, pathname } = useRouter()
  const { navigate } = useStorageRouter()
  const { preferences, openTab, togglePreferencesModal } = usePreferences()
  const routeParams = useRouteParams() as
    | StorageTagsRouteParams
    | StorageNotesRouteParams
    | BoostHubTeamsShowRouteParams
  const { t } = useTranslation()
  const boostHubUserInfo = preferences['cloud.user']
  const { signOut } = useBoostHub()
  const {
    createFolderApi,
    createDocApi,
    deleteFolderApi,
    toggleDocArchived,
    toggleDocBookmark,
  } = useLocalDB()
  const {
    openWorkspaceEditForm,
    openNewFolderForm,
    openRenameFolderForm,
    openRenameDocForm,
    removeWorkspace,
    exportDocuments,
  } = useLocalUI()
  const { draggedResource, dropInDocOrFolder } = useLocalDnd()
  const { generalStatus, setGeneralStatus } = useGeneralStatus()
  const { popup } = useContextMenu()
  const [showSpaces, setShowSpaces] = useState(false)
  const [sidebarState, setSidebarState] = useState<SidebarState | undefined>(
    hideSidebar != null && hideSidebar
      ? undefined
      : initialSidebarState != null
      ? initialSidebarState
      : generalStatus.lastSidebarStateLocalSpace
  )
  const [sidebarSearchQuery, setSidebarSearchQuery] = useState('')
  const { toggleShowingCloudIntroModal } = useCloudIntroModal()
  const [searchResults, setSearchResults] = useState<SidebarSearchResult[]>([])
  const usersMap = new Map<string, AppUser>()
  const [initialLoadDone] = useState(true)
  const {
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    toggleItem,
    unfoldItem,
    foldItem,
  } = useSidebarCollapse()
  const { history, searchHistory, addToSearchHistory } = useSidebarSearch()

  const localSpaces = useMemo(() => values(storageMap), [storageMap])

  const openStorageContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      event.stopPropagation()
      if (workspace == null) {
        return
      }

      const workspaceId = workspace.id
      openContextMenu({
        menuItems: [
          {
            type: 'normal',
            label: t('storage.rename'),
            click: () => openWorkspaceEditForm(workspace),
          },
          {
            type: 'normal',
            label: 'New Space',
            click: () => {
              push('/app/storages')
            },
          },
          {
            type: 'separator',
          },
          {
            type: 'normal',
            label: 'Export Folder',
            click: () =>
              exportDocuments(workspace, {
                folderName: workspace.name,
                folderPathname: '/',
                exportingStorage: true,
              }),
          },
          {
            type: 'normal',
            label: 'Preferences',
            click: () => {
              togglePreferencesModal()
            },
          },
          {
            type: 'separator',
          },
          ...localSpaces
            .filter((storage) => {
              return storage.id !== workspaceId
            })
            .map<MenuItemConstructorOptions>((storage) => {
              return {
                type: 'normal',
                label: `Switch to ${storage.name} storage`,
                click: () => {
                  navigate(storage.id)
                },
              }
            }),
          {
            type: 'separator',
          },
          {
            type: 'normal',
            label: t('storage.remove'),
            click: () => removeWorkspace(workspace),
          },
        ],
      })
    },
    [
      workspace,
      t,
      localSpaces,
      openWorkspaceEditForm,
      push,
      exportDocuments,
      togglePreferencesModal,
      navigate,
      removeWorkspace,
    ]
  )

  const createFolderByRoute = useCallback(async () => {
    if (workspace == null) {
      return
    }
    const workspaceId = workspace.id
    let folderPathname = '/'
    switch (routeParams.name) {
      case 'workspaces.notes':
        if (routeParams.folderPathname !== '/') {
          folderPathname = routeParams.folderPathname
        }
        break
    }

    await openNewFolderForm({
      workspaceId: workspaceId,
      parentFolderPathname: folderPathname,
      navigateToFolder: true,
    })
  }, [workspace, routeParams, openNewFolderForm])

  const createNoteByRoute = useCallback(async () => {
    if (workspace == null) {
      return
    }
    const workspaceId = workspace.id
    let folderPathname = '/'
    let tags: string[] = []
    let baseHrefAfterCreate = `/app/storages/${workspaceId}/notes`
    switch (routeParams.name) {
      case 'workspaces.labels.show':
        tags = [routeParams.tagName]
        baseHrefAfterCreate = `/app/storages/${workspaceId}/tags/${routeParams.tagName}`
        break
      case 'workspaces.notes':
        if (routeParams.folderPathname !== '/') {
          folderPathname = routeParams.folderPathname
          baseHrefAfterCreate = `/app/storages/${workspaceId}/notes${folderPathname}`
        }
        break
    }

    const note = await createNote(workspaceId, {
      folderPathname,
      tags,
    })
    if (note == null) {
      return
    }

    push(`${baseHrefAfterCreate}/${note._id}#new`)
  }, [workspace, routeParams, push, createNote])

  useEffect(() => {
    if (hash === '#new') {
      push({ hash: '' })
      setImmediate(() => {
        noteDetailFocusTitleInputEventEmitter.dispatch()
      })
    }
  }, [push, hash])

  useEffect(() => {
    const handler = async () => {
      await createNoteByRoute()
    }
    addIpcListener('new-note', handler)
    return () => {
      removeIpcListener('new-note', handler)
    }
  }, [createNoteByRoute])

  useEffect(() => {
    const handler = async () => {
      await createFolderByRoute()
    }
    addIpcListener('new-folder', handler)
    return () => {
      removeIpcListener('new-folder', handler)
    }
  }, [createFolderByRoute, createNoteByRoute])

  const { toggleShowSearchModal } = useSearchModal()

  useEffect(() => {
    const handler = () => {
      toggleShowSearchModal()
    }
    addIpcListener('search', handler)
    return () => {
      removeIpcListener('search', handler)
    }
  }, [toggleShowSearchModal])

  useEffect(() => {
    setGeneralStatus({ lastSidebarStateLocalSpace: sidebarState })
  }, [sidebarState, setSidebarState, setGeneralStatus])

  const openState = useCallback((state: SidebarState) => {
    setSidebarState((prev) => (prev === state ? undefined : state))
  }, [])

  const toolbarRows: SidebarToolbarRow[] = useMemo(() => {
    if (workspace != null) {
      return mapToolbarRows(
        showSpaces,
        setShowSpaces,
        openState,
        openTab,
        toggleShowingCloudIntroModal,
        sidebarState,
        workspace
      )
    } else {
      return [
        {
          tooltip: 'Spaces',
          active: showSpaces,
          icon: mdiMenu,
          onClick: () => setShowSpaces((prev) => !prev),
        },
      ] as SidebarToolbarRow[]
    }
  }, [
    openState,
    openTab,
    showSpaces,
    sidebarState,
    workspace,
    toggleShowingCloudIntroModal,
  ])

  const sidebarResize = useCallback(
    (width: number) => setGeneralStatus({ sideBarWidth: width }),
    [setGeneralStatus]
  )
  const setSearchQuery = useCallback((val: string) => {
    setSidebarSearchQuery(val)
  }, [])

  const historyItems = useMemo(() => {
    if (workspace == null) {
      return []
    }
    return mapHistory(
      history || [],
      push,
      workspace.noteMap,
      workspace.folderMap,
      workspace
    )
  }, [history, push, workspace])
  const { submit: submitSearch, sending: fetchingSearchResults } = useApi<
    { query: any },
    { results: NoteSearchData[] }
  >({
    api: ({ query }: { query: any }) => {
      return Promise.resolve({
        results: getSearchResultItems(workspace, query.query),
      })
    },
    cb: ({ results }) => {
      setSearchResults(mapSearchResults(results, push, workspace))
    },
  })

  const [isNotDebouncing, cancel] = useDebounce(
    async () => {
      if (workspace == null || sidebarSearchQuery.trim() === '') {
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
      await submitSearch({ query: searchParams })
    },
    600,
    [sidebarSearchQuery]
  )

  const getFoldEvents = useCallback(
    (type: CollapsableType, key: string) => {
      return {
        fold: () => foldItem(type, key),
        unfold: () => unfoldItem(type, key),
        toggle: () => toggleItem(type, key),
      }
    },
    [foldItem, unfoldItem, toggleItem]
  )

  const tree = useMemo(() => {
    if (workspace == null) {
      return undefined
    }
    return mapTree(
      initialLoadDone,
      generalStatus.sidebarTreeSortingOrder,
      workspace,
      workspace.noteMap,
      workspace.folderMap,
      workspace.tagMap,
      pathname,
      sideBarOpenedLinksIdsSet,
      sideBarOpenedFolderIdsSet,
      toggleItem,
      getFoldEvents,
      push,
      toggleDocBookmark,
      toggleDocArchived,
      deleteFolderApi,
      createFolderApi,
      createDocApi,
      draggedResource,
      dropInDocOrFolder,
      openRenameFolderForm,
      openRenameDocForm,
      exportDocuments
    )
  }, [
    workspace,
    initialLoadDone,
    generalStatus.sidebarTreeSortingOrder,
    pathname,
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    toggleItem,
    getFoldEvents,
    push,
    toggleDocBookmark,
    toggleDocArchived,
    deleteFolderApi,
    createFolderApi,
    createDocApi,
    draggedResource,
    dropInDocOrFolder,
    openRenameFolderForm,
    openRenameDocForm,
    exportDocuments,
  ])

  const activeBoostHubTeamDomain = useMemo<string | null>(() => {
    if (routeParams.name !== 'boosthub.teams.show') {
      return null
    }
    return routeParams.domain
  }, [routeParams])

  const spaces = useMemo(() => {
    const activeWorkspaceId: string | null =
      workspace == null ? null : workspace.id
    const allSpaces: SidebarSpace[] = []
    const onSpaceLinkClick = (
      event: React.MouseEvent,
      workspace: NoteStorage
    ) => {
      event.preventDefault()
      setGeneralStatus({ lastSidebarStateLocalSpace: 'tree' })
      if (sidebarState == undefined) {
        setSidebarState('tree')
      }
      navigate(workspace.id)
    }
    const onSpaceContextMenu = (
      event: React.MouseEvent,
      space: NoteStorage
    ) => {
      event.preventDefault()
      event.stopPropagation()
      const menuItems: MenuItemConstructorOptions[] = [
        {
          type: 'normal',
          label: t('storage.rename'),
          click: () => openWorkspaceEditForm(space),
        },
        { type: 'separator' },
        {
          type: 'normal',
          label: t('storage.remove'),
          click: () => removeWorkspace(space),
        },
      ]
      openContextMenu({ menuItems })
    }

    localSpaces.forEach((workspace, index) => {
      allSpaces.push(
        mapLocalSpace(
          workspace,
          index,
          activeWorkspaceId,
          onSpaceLinkClick,
          onSpaceContextMenu
        )
      )
    })
    generalStatus.boostHubTeams.forEach((boostHubTeam, index) => {
      allSpaces.push({
        label: boostHubTeam.name,
        icon: boostHubTeam.iconUrl,
        active: activeBoostHubTeamDomain === boostHubTeam.domain,
        tooltip: `${osName === 'macos' ? '⌘' : 'Ctrl'} ${
          localSpaces.length + index + 1
        }`,
        linkProps: {
          onClick: (event) => {
            event.preventDefault()
            push(`/app/boosthub/teams/${boostHubTeam.domain}`)
          },
        },
      })
    })

    return allSpaces
  }, [
    workspace,
    localSpaces,
    generalStatus.boostHubTeams,
    sidebarState,
    navigate,
    setGeneralStatus,
    t,
    openWorkspaceEditForm,
    removeWorkspace,
    activeBoostHubTeamDomain,
    push,
  ])

  const timelineRows = useMemo(() => {
    if (workspace == null) {
      return []
    }
    return mapTimelineItems(values(workspace.noteMap), push, workspace)
  }, [push, workspace])

  const spaceBottomRows = useMemo(() => {
    const rows: SidebarSpaceContentRow[] = []
    rows.push({
      label: 'Create Space',
      icon: mdiPlus,
      linkProps: {
        onClick: (event) => {
          event.preventDefault()
          if (boostHubUserInfo == null) {
            push('/app/boosthub/login')
          } else {
            push('/app/boosthub/teams')
          }
        },
      },
    })

    if (boostHubUserInfo == null) {
      rows.push({
        label: 'Sign in',
        icon: mdiLogin,
        linkProps: {
          onClick: (event) => {
            event.preventDefault()

            push('/app/boosthub/login')
          },
        },
      })
    } else {
      rows.push({
        label: 'Sign Out Team Account',
        icon: mdiLogout,
        linkProps: {
          onClick: (event) => {
            event.preventDefault()
            signOut()
          },
        },
      })
    }

    return rows
  }, [boostHubUserInfo, push, signOut])

  return (
    <NavigatorContainer onContextMenu={openStorageContextMenu}>
      <Sidebar
        className={cc(['application__sidebar'])}
        showToolbar={true}
        popOver={showSpaces ? 'spaces' : null}
        onSpacesBlur={() => setShowSpaces(false)}
        toolbarRows={toolbarRows}
        spaces={spaces}
        spaceBottomRows={spaceBottomRows}
        sidebarExpandedWidth={generalStatus.sideBarWidth}
        sidebarState={sidebarState}
        tree={tree}
        sidebarResize={sidebarResize}
        searchQuery={sidebarSearchQuery}
        setSearchQuery={setSearchQuery}
        searchHistory={searchHistory}
        recentPages={historyItems}
        treeControls={[
          {
            icon:
              generalStatus.sidebarTreeSortingOrder === 'a-z'
                ? SidebarTreeSortingOrders.aZ.icon
                : generalStatus.sidebarTreeSortingOrder === 'z-a'
                ? SidebarTreeSortingOrders.zA.icon
                : generalStatus.sidebarTreeSortingOrder === 'last-updated'
                ? SidebarTreeSortingOrders.lastUpdated.icon
                : SidebarTreeSortingOrders.lastUpdated.icon,
            // todo: [komediruzecki-05/06/2021] When drag and drop order is implemented enable this
            // : SidebarTreeSortingOrders.dragDrop.icon,
            onClick: (event) => {
              popup(
                event,
                Object.values(SidebarTreeSortingOrders).map((sort) => {
                  return {
                    type: MenuTypes.Normal,
                    onClick: () =>
                      setGeneralStatus({
                        sidebarTreeSortingOrder: sort.value,
                      }),
                    label: sort.label,
                    icon: sort.icon,
                    active:
                      sort.value === generalStatus.sidebarTreeSortingOrder,
                  }
                })
              )
            },
          },
        ]}
        treeTopRows={
          workspace == null ? null : <NewDocButton workspace={workspace} />
        }
        searchResults={searchResults}
        users={usersMap}
        timelineRows={timelineRows}
        timelineMore={
          workspace != null
            ? {
                variant: 'primary',
                onClick: () => push(getTimelineHref(workspace)),
              }
            : undefined
        }
        sidebarSearchState={{
          fetching: fetchingSearchResults,
          isNotDebouncing: isNotDebouncing() === true,
        }}
      />
    </NavigatorContainer>
  )
}

export default SidebarContainer

const NavigatorContainer = styled.nav``
