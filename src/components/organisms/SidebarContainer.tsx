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
import { values } from '../../lib/db/utils'
import { MenuItemConstructorOptions } from 'electron'
import { useStorageRouter } from '../../lib/storageRouter'
import {
  BoostHubTeamsShowRouteParams,
  StorageNotesRouteParams,
  StorageTagsRouteParams,
  useRouteParams,
} from '../../lib/routeParams'
import {
  mdiCloudOffOutline,
  mdiCog,
  mdiLogin,
  mdiLogout,
  mdiMagnify,
  mdiPlus,
} from '@mdi/js'
import { noteDetailFocusTitleInputEventEmitter } from '../../lib/events'
import { useTranslation } from 'react-i18next'
import { useSearchModal } from '../../lib/searchModal'
import styled from '../../shared/lib/styled'
import cc from 'classcat'
import { SidebarTreeSortingOrders } from '../../shared/lib/sidebar'
import { useGeneralStatus } from '../../lib/generalStatus'
import { AppUser } from '../../shared/lib/mappers/users'
import { useLocalUI } from '../../lib/v2/hooks/local/useLocalUI'
import { mapTree } from '../../lib/v2/mappers/local/sidebarTree'
import { useLocalDB } from '../../lib/v2/hooks/local/useLocalDB'
import { useLocalDnd } from '../../lib/v2/hooks/local/useLocalDnd'
import { CollapsableType } from '../../lib/v2/stores/sidebarCollapse'
import { useSidebarCollapse } from '../../lib/v2/stores/sidebarCollapse'
import { useCloudIntroModal } from '../../lib/cloudIntroModal'
import { mapLocalSpace } from '../../lib/v2/mappers/local/sidebarSpaces'
import { osName } from '../../shared/lib/platform'
import {
  SidebarSpace,
  SidebarSpaceContentRow,
} from '../../shared/components/organisms/Sidebar/molecules/SidebarSpaces'
import { useBoostHub } from '../../lib/boosthub'
import NewDocButton from '../molecules/NewDocButton'
import Sidebar from '../../shared/components/organisms/Sidebar'
import SidebarHeader, {
  SidebarControls,
} from '../../shared/components/organisms/Sidebar/atoms/SidebarHeader'
import SidebarButtonList from '../../shared/components/organisms/Sidebar/molecules/SidebarButtonList'

interface SidebarContainerProps {
  workspace?: NoteStorage
  toggleSearchScreen: () => void
}

const SidebarContainer = ({
  workspace,
  toggleSearchScreen,
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
  const [showSpaces, setShowSpaces] = useState(false)
  const {
    toggleShowingCloudIntroModal,
    showingCloudIntroModal,
  } = useCloudIntroModal()
  const usersMap = new Map<string, AppUser>()
  const [initialLoadDone] = useState(true)
  const {
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    toggleItem,
    unfoldItem,
    foldItem,
  } = useSidebarCollapse()

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

  const sidebarResize = useCallback(
    (width: number) => setGeneralStatus({ sideBarWidth: width }),
    [setGeneralStatus]
  )

  const getFoldEvents = useCallback(
    (type: CollapsableType, key: string, reversed?: boolean) => {
      if (reversed) {
        return {
          fold: () => unfoldItem(type, key),
          unfold: () => foldItem(type, key),
          toggle: () => toggleItem(type, key),
        }
      }

      return {
        fold: () => foldItem(type, key),
        unfold: () => unfoldItem(type, key),
        toggle: () => toggleItem(type, key),
      }
    },
    [toggleItem, unfoldItem, foldItem]
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

  const sidebarHeaderControls: SidebarControls = useMemo(() => {
    return {
      'View Options': (tree || []).map((category) => {
        const key = (category.label || '').toLocaleLowerCase()
        const hideKey = `hide-${key}`
        return {
          type: 'check',
          label: category.label,
          checked: !sideBarOpenedLinksIdsSet.has(hideKey),
          onClick: () => toggleItem('links', hideKey),
        }
      }),
      Sorting: Object.values(SidebarTreeSortingOrders).map((sort) => {
        return {
          type: 'radio',
          label: sort.label,
          icon: sort.icon,
          checked: sort.value === generalStatus.sidebarTreeSortingOrder,
          onClick: () =>
            setGeneralStatus({
              sidebarTreeSortingOrder: sort.value,
            }),
        }
      }),
    }
  }, [
    tree,
    generalStatus.sidebarTreeSortingOrder,
    setGeneralStatus,
    sideBarOpenedLinksIdsSet,
    toggleItem,
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
    navigate,
    t,
    openWorkspaceEditForm,
    removeWorkspace,
    activeBoostHubTeamDomain,
    push,
  ])

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

  const activeSpace = spaces.find((space) => space.active)
  const sidebarHeader = useMemo(() => {
    return (
      <>
        <SidebarHeader
          onSpaceClick={() => setShowSpaces(true)}
          spaceName={activeSpace != null ? activeSpace.label : '...'}
          spaceImage={
            activeSpace != null && activeSpace.icon != null
              ? activeSpace.icon
              : undefined
          }
          controls={sidebarHeaderControls}
        />
        {workspace == null ? null : (
          <SidebarButtonList
            rows={[
              {
                label: 'Search',
                icon: mdiMagnify,
                variant: 'transparent',
                labelClick: toggleSearchScreen,
                id: 'sidebar__button__search',
                active: false,
              },
              {
                label: 'Settings',
                icon: mdiCog,
                variant: 'transparent',
                labelClick: () => openTab('about'),
                id: 'sidebar__button__members',
              },
            ]}
          >
            <NewDocButton workspace={workspace} />
          </SidebarButtonList>
        )}
      </>
    )
  }, [
    activeSpace,
    openTab,
    sidebarHeaderControls,
    toggleSearchScreen,
    workspace,
  ])

  const sidebarFooter = useMemo(() => {
    return (
      <SidebarButtonList
        rows={[
          {
            label: 'Cloud Intro',
            active: showingCloudIntroModal,
            icon: mdiCloudOffOutline,
            variant: 'subtle',
            labelClick: () => toggleShowingCloudIntroModal(),
            id: 'sidebar__button__cloud',
          },
        ]}
      />
    )
  }, [showingCloudIntroModal, toggleShowingCloudIntroModal])

  return (
    <NavigatorContainer onContextMenu={openStorageContextMenu}>
      <Sidebar
        className={cc(['application__sidebar'])}
        popOver={showSpaces ? 'spaces' : null}
        onSpacesBlur={() => setShowSpaces(false)}
        spaces={spaces}
        spaceBottomRows={spaceBottomRows}
        sidebarExpandedWidth={generalStatus.sideBarWidth}
        tree={tree}
        sidebarResize={sidebarResize}
        header={sidebarHeader}
        treeBottomRows={sidebarFooter}
        users={usersMap}
      />
    </NavigatorContainer>
  )
}

export default SidebarContainer

const NavigatorContainer = styled.nav``
