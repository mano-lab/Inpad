import React, { useCallback, useMemo, MouseEvent } from 'react'
import {
  mdiApplicationCog,
  mdiArchiveOutline,
  mdiCheckCircleOutline,
  mdiFileDocumentOutline,
  mdiFilePlusOutline,
  mdiFolderCogOutline,
  mdiFolderPlusOutline,
  mdiLock,
  mdiPauseCircleOutline,
  mdiPencil,
  mdiPlayCircleOutline,
  mdiPlus,
  mdiStar,
  mdiStarOutline,
  mdiTag,
  mdiTrashCanOutline,
  mdiWeb,
  mdiDotsHorizontal,
} from '@mdi/js'
import { FoldingProps } from '../../../shared/components/atoms/FoldingWrapper'
import { SidebarTreeSortingOrder } from '../../../shared/lib/sidebar'
import {
  MenuItem,
  MenuTypes,
  useContextMenu,
} from '../../../shared/lib/stores/contextMenu'
import { useModal } from '../../../shared/lib/stores/modal'
import {
  getMapValues,
  sortByAttributeAsc,
  sortByAttributeDesc,
} from '../../../shared/lib/utils/array'
import {
  getDocLinkHref,
  getFolderHref,
  getTagHref,
  getTeamLinkHref,
} from '../../lib/href'
import { getWorkspaceHref } from '../../../cloud/components/atoms/Link/WorkspaceLink'
import { SerializedWorkspace } from '../../../cloud/interfaces/db/workspace'
import { useRouter } from '../../../cloud/lib/router'
import {
  cloudSidebaCategoryLabels,
  cloudSidebarOrderedCategoriesDelimiter,
} from '../../../cloud/lib/sidebar'
import { useNav } from '../../../cloud/lib/stores/nav'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { usePreferences } from '../preferences'
import {
  CollapsableType,
  useSidebarCollapse,
} from '../../../cloud/lib/stores/sidebarCollapse'
import {
  getDocId,
  getDocTitle,
  getFolderId,
} from '../../../cloud/lib/utils/patterns'
import { useCloudApi } from '../../../cloud/lib/hooks/useCloudApi'
import { getDocStatusHref, getSmartFolderHref } from '../href'
import { useDialog } from '../../../shared/lib/stores/dialog'
import { useAppStatus } from '../appStatus'
import SmartFolderCreateModal from '../../components/organisms/modals/SmartFolderCreateModal'
import SmartFolderUpdateModal from '../../components/organisms/modals/SmartFolderUpdateModal'
import WorkspaceCreateModal from '../../components/organisms/modals/WorkspaceCreateModal'
import { useMobileResourceModals } from '../useMobileResourceModals'

export function useNavigatorTree() {
  const { team, currentUserIsCoreMember } = usePage()
  const { push, pathname } = useRouter()
  const { openModal } = useModal()
  const { preferences } = usePreferences()
  const { messageBox } = useDialog()
  const { setShowingNavigator } = useAppStatus()

  const {
    initialLoadDone,
    docsMap,
    foldersMap,
    workspacesMap,
    tagsMap,
    smartFoldersMap,
  } = useNav()

  const {
    sideBarOpenedLinksIdsSet,
    sideBarOpenedFolderIdsSet,
    sideBarOpenedWorkspaceIdsSet,
    toggleItem,
    unfoldItem,
    foldItem,
  } = useSidebarCollapse()

  const {
    sendingMap: treeSendingMap,
    createWorkspace,
    createDoc,
    createFolder,
    toggleDocBookmark,
    toggleFolderBookmark,
    deleteSmartFolder,
  } = useCloudApi()

  const {
    deleteWorkspace,
    deleteFolder,
    deleteDoc,
    openRenameFolderForm,
    openRenameDocForm,
    openWorkspaceEditForm,
  } = useMobileResourceModals()

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

  const { popup } = useContextMenu()
  const tree = useMemo(() => {
    if (!initialLoadDone || team == null) {
      return undefined
    }

    const currentPathWithDomain = `${process.env.BOOST_HUB_BASE_URL}${pathname}`
    const items = new Map<string, CloudTreeItem>()
    const sortingOrder = preferences.navigatorTreeSortingOrder

    const [docs, folders, workspaces, smartFolders] = [
      getMapValues(docsMap),
      getMapValues(foldersMap),
      getMapValues(workspacesMap),
      getMapValues(smartFoldersMap),
    ]

    let personalWorkspace: SerializedWorkspace | undefined
    workspaces.forEach((wp) => {
      if (wp.personal) {
        personalWorkspace = wp
        return
      }

      const href = `${process.env.BOOST_HUB_BASE_URL}${getWorkspaceHref(
        wp,
        team,
        'index'
      )}`

      const coreRestrictedFeatures: Partial<CloudTreeItem> = currentUserIsCoreMember
        ? {
            controls: [
              {
                icon: mdiPlus,
                onClick: (event, openCreateForm) => {
                  popup(event, [
                    {
                      type: MenuTypes.Normal,
                      icon: mdiFilePlusOutline,
                      label: 'Create Document',
                      onClick: () => {
                        openCreateForm({
                          placeholder: 'Document title...',
                          onSubmit: (title) => {
                            createDoc(
                              team,
                              {
                                workspaceId: wp.id,
                                title,
                              },
                              {
                                afterSuccess: () => {
                                  setShowingNavigator(false)
                                },
                              }
                            )
                          },
                        })
                      },
                    },
                    {
                      type: MenuTypes.Normal,
                      icon: mdiFolderPlusOutline,
                      label: 'Create Folder',
                      onClick: () => {
                        openCreateForm({
                          placeholder: 'Folder name...',
                          onSubmit: (folderName) => {
                            createFolder(
                              team,
                              {
                                workspaceId: wp.id,
                                description: '',
                                folderName,
                              },
                              {
                                skipRedirect: false,
                              }
                            )
                          },
                        })
                      },
                    },
                  ] as MenuItem[])
                },
              },
            ],
            contextControls: wp.default
              ? [
                  {
                    type: MenuTypes.Normal,
                    icon: mdiApplicationCog,
                    label: 'Edit',
                    onClick: () => openWorkspaceEditForm(wp),
                  },
                ]
              : [
                  {
                    type: MenuTypes.Normal,
                    icon: mdiApplicationCog,
                    label: 'Edit',
                    onClick: () => openWorkspaceEditForm(wp),
                  },
                  {
                    type: MenuTypes.Normal,
                    icon: mdiTrashCanOutline,
                    label: 'Delete',
                    onClick: () => deleteWorkspace(wp),
                  },
                ],
          }
        : {}

      items.set(wp.id, {
        id: wp.id,
        lastUpdated: wp.updatedAt,
        label: wp.name,
        defaultIcon: !wp.public ? mdiLock : undefined,
        children: wp.positions?.orderedIds || [],
        folded: !sideBarOpenedWorkspaceIdsSet.has(wp.id),
        folding: getFoldEvents('workspaces', wp.id),
        href,
        active: href === currentPathWithDomain,
        navigateTo: () => {
          setShowingNavigator(false)
          push(href)
        },
        ...coreRestrictedFeatures,
      })
    })

    folders.forEach((folder) => {
      const folderId = getFolderId(folder)
      const href = `${process.env.BOOST_HUB_BASE_URL}${getFolderHref(
        folder,
        team,
        'index'
      )}`

      const coreRestrictedFeatures: Partial<CloudTreeItem> = currentUserIsCoreMember
        ? {
            controls: [
              {
                icon: mdiPlus,
                onClick: (event, openCreateForm) => {
                  popup(event, [
                    {
                      type: MenuTypes.Normal,
                      icon: mdiFilePlusOutline,
                      label: 'Create Document',
                      onClick: () => {
                        openCreateForm({
                          placeholder: 'Document title...',
                          onSubmit: (title) => {
                            createDoc(
                              team,
                              {
                                workspaceId: folder.workspaceId,
                                parentFolderId: folder.id,
                                title,
                              },
                              {
                                afterSuccess: () => {
                                  setShowingNavigator(false)
                                },
                              }
                            )
                          },
                        })
                      },
                    },
                    {
                      type: MenuTypes.Normal,
                      icon: mdiFolderPlusOutline,
                      label: 'Create Folder',
                      onClick: () => {
                        openCreateForm({
                          placeholder: 'Folder name...',
                          onSubmit: (folderName) => {
                            createFolder(
                              team,
                              {
                                workspaceId: folder.workspaceId,
                                parentFolderId: folder.id,
                                description: '',
                                folderName,
                              },
                              { skipRedirect: true }
                            )
                          },
                        })
                      },
                    },
                  ] as MenuItem[])
                },
              },
              {
                icon: mdiDotsHorizontal,
                onClick: (event) => {
                  popup(event, [
                    {
                      type: MenuTypes.Normal,
                      icon: folder.bookmarked ? mdiStar : mdiStarOutline,
                      label:
                        treeSendingMap.get(folder.id) === 'bookmark'
                          ? '...'
                          : folder.bookmarked
                          ? 'Bookmarked'
                          : 'Bookmark',
                      onClick: () =>
                        toggleFolderBookmark(
                          folder.teamId,
                          folder.id,
                          folder.bookmarked
                        ),
                    },
                    {
                      type: MenuTypes.Normal,
                      icon: mdiPencil,
                      label: 'Rename',
                      onClick: () => openRenameFolderForm(folder),
                    },
                    {
                      type: MenuTypes.Normal,
                      icon: mdiTrashCanOutline,
                      label: 'Delete',
                      onClick: () => deleteFolder(folder),
                    },
                  ])
                },
              },
            ],
          }
        : {
            controls: [
              {
                icon: folder.bookmarked ? mdiStar : mdiStarOutline,
                onClick: () =>
                  toggleFolderBookmark(
                    folder.teamId,
                    folder.id,
                    folder.bookmarked
                  ),
              },
            ],
          }

      items.set(folderId, {
        id: folderId,
        lastUpdated: folder.updatedAt,
        label: folder.name,
        bookmarked: folder.bookmarked,
        emoji: folder.emoji,
        folded: !sideBarOpenedFolderIdsSet.has(folder.id),
        folding: getFoldEvents('folders', folder.id),
        href,
        active: href === currentPathWithDomain,
        navigateTo: () => {
          setShowingNavigator(false)
          push(href)
        },
        ...coreRestrictedFeatures,
        parentId:
          folder.parentFolderId == null
            ? folder.workspaceId
            : folder.parentFolderId,
        children:
          typeof folder.positions != null &&
          typeof folder.positions !== 'string'
            ? folder.positions.orderedIds
            : [],
      })
    })

    docs.forEach((doc) => {
      const docId = getDocId(doc)
      const href = `${process.env.BOOST_HUB_BASE_URL}${getDocLinkHref(
        doc,
        team,
        'index'
      )}`

      const coreRestrictedFeatures: Partial<CloudTreeItem> = currentUserIsCoreMember
        ? {
            navigateTo: () => {
              setShowingNavigator(false)
              push(href)
            },
            contextControls: [
              {
                type: MenuTypes.Normal,
                icon: doc.bookmarked ? mdiStar : mdiStarOutline,
                label:
                  treeSendingMap.get(doc.id) === 'bookmark'
                    ? '...'
                    : doc.bookmarked
                    ? 'Bookmarked'
                    : 'Bookmark',
                onClick: () =>
                  toggleDocBookmark(doc.teamId, doc.id, doc.bookmarked),
              },
              {
                type: MenuTypes.Normal,
                icon: mdiPencil,
                label: 'Rename',
                onClick: () => openRenameDocForm(doc),
              },
              {
                type: MenuTypes.Normal,
                icon: mdiTrashCanOutline,
                label: 'Delete',
                onClick: () => deleteDoc(doc),
              },
            ],
          }
        : {
            controls: [
              {
                icon: doc.bookmarked ? mdiStar : mdiStarOutline,
                onClick: () =>
                  toggleDocBookmark(doc.teamId, doc.id, doc.bookmarked),
              },
            ],
          }

      items.set(docId, {
        id: docId,
        lastUpdated: doc.head != null ? doc.head.created : doc.updatedAt,
        label: getDocTitle(doc, 'Untitled'),
        bookmarked: doc.bookmarked,
        emoji: doc.emoji,
        defaultIcon: mdiFileDocumentOutline,
        hidden:
          doc.archivedAt != null ||
          doc.status === 'archived' ||
          doc.status === 'completed',
        children: [],
        href,
        active: href === currentPathWithDomain,
        ...coreRestrictedFeatures,
        parentId:
          doc.parentFolderId == null ? doc.workspaceId : doc.parentFolderId,
      })
    })

    const arrayItems = getMapValues(items)
    const tree: Partial<NavigatorCategory>[] = []

    let orderedBookmarked = []
    const bookmarked = arrayItems.reduce((acc, val) => {
      if (!val.bookmarked) {
        return acc
      }

      acc.push({
        id: val.id,
        depth: 0,
        label: val.label,
        emoji: val.emoji,
        defaultIcon: val.defaultIcon,
        href: val.href,
        navigateTo: val.navigateTo,
        contextControls: val.contextControls,
        lastUpdated: val.lastUpdated,
      })

      return acc
    }, [] as (NavigatorRow & { lastUpdated: string })[])

    switch (preferences.navigatorTreeSortingOrder) {
      case 'z-a':
        orderedBookmarked = sortByAttributeDesc('label', bookmarked)
        break
      case 'last-updated':
        orderedBookmarked = sortByAttributeDesc('lastUpdated', bookmarked)
        break
      case 'a-z':
      default:
        orderedBookmarked = sortByAttributeAsc('label', bookmarked)
        break
    }

    const navTree = arrayItems
      .filter((item) => item.parentId == null)
      .reduce((acc, val) => {
        acc.push({
          ...val,
          depth: 0,
          rows: buildChildrenNavRows(sortingOrder, val.children, 1, items),
        })
        return acc
      }, [] as NavigatorRow[])

    const docsPerTagIdMap = [...docsMap.values()].reduce((acc, doc) => {
      const docTags = doc.tags || []
      docTags.forEach((tag) => {
        let docIds = acc.get(tag.id)
        if (docIds == null) {
          docIds = []
          acc.set(tag.id, docIds)
        }
        docIds.push(doc.id)
      })
      return acc
    }, new Map<string, string[]>())

    const labels = getMapValues(tagsMap)
      .filter((tag) => (docsPerTagIdMap.get(tag.id) || []).length > 0)
      .sort((a, b) => {
        if (a.text < b.text) {
          return -1
        } else {
          return 1
        }
      })
      .reduce((acc, val) => {
        const href = `${process.env.BOOST_HUB_BASE_URL}${getTagHref(
          val,
          team,
          'index'
        )}`
        acc.push({
          id: val.id,
          depth: 0,
          label: val.text,
          defaultIcon: mdiTag,
          href,
          active: href === currentPathWithDomain,
          navigateTo: () => {
            setShowingNavigator(false)
            push(href)
          },
        })
        return acc
      }, [] as NavigatorRow[])

    if (orderedBookmarked.length > 0) {
      tree.push({
        label: 'Bookmarks',
        rows: orderedBookmarked,
      })
    }

    tree.push({
      label: 'Smart Folders',
      rows: smartFolders.map((smartFolder) => {
        const href = `${process.env.BOOST_HUB_BASE_URL}${getSmartFolderHref(
          smartFolder,
          team,
          'index'
        )}`
        return {
          id: smartFolder.id,
          label: smartFolder.name,
          defaultIcon: mdiFolderCogOutline,
          depth: 0,
          active: href === currentPathWithDomain,
          navigateTo: () => {
            setShowingNavigator(false)
            push(href)
          },
          contextControls: !currentUserIsCoreMember
            ? undefined
            : [
                {
                  type: MenuTypes.Normal,
                  icon: mdiPencil,
                  label: 'Edit',
                  onClick: () => {
                    openModal(
                      <SmartFolderUpdateModal smartFolder={smartFolder} />
                    )
                  },
                },
                {
                  type: MenuTypes.Normal,
                  icon: mdiTrashCanOutline,
                  label: 'Delete',
                  onClick: () => {
                    messageBox({
                      title: `Delete ${smartFolder.name}?`,
                      message: `Are you sure to delete this smart folder?`,
                      buttons: [
                        {
                          variant: 'secondary',
                          label: 'Cancel',
                          cancelButton: true,
                          defaultButton: true,
                        },
                        {
                          variant: 'danger',
                          label: 'Delete',
                          onClick: async () => {
                            await deleteSmartFolder(smartFolder)
                          },
                        },
                      ],
                    })
                  },
                },
              ],
        }
      }),
      controls: currentUserIsCoreMember
        ? [
            {
              icon: mdiPlus,
              onClick: () => {
                openModal(<SmartFolderCreateModal />)
              },
            },
          ]
        : undefined,
    })

    tree.push({
      label: 'Folders',
      rows: navTree,
      controls: currentUserIsCoreMember
        ? [
            {
              icon: mdiPlus,
              onClick: () => openModal(<WorkspaceCreateModal />),
            },
          ]
        : undefined,
    })

    if (!team.personal && currentUserIsCoreMember) {
      tree.push({
        label: 'Private',
        rows:
          personalWorkspace != null
            ? arrayItems
                .filter((item) => item.parentId === personalWorkspace!.id)
                .reduce((acc, val) => {
                  acc.push({
                    ...val,
                    depth: 0,
                    rows: buildChildrenNavRows(
                      sortingOrder,
                      val.children,
                      1,
                      items
                    ),
                  })
                  return acc
                }, [] as NavigatorRow[])
            : [],
        controls: [
          {
            icon: mdiPlus,
            onClick: (event, _openCreateForm) => {
              const openCreateForm = _openCreateForm
              popup(event, [
                {
                  type: MenuTypes.Normal,
                  icon: mdiFilePlusOutline,
                  label: 'Create Document',
                  onClick: () => {
                    openCreateForm({
                      placeholder: 'Document title...',
                      onSubmit: (title) => {
                        if (personalWorkspace == null) {
                          return createWorkspace(
                            team,
                            {
                              personal: true,
                              name: 'Private',
                              permissions: [],
                              public: false,
                            },
                            {
                              afterSuccess: (wp) => {
                                createDoc(team, {
                                  workspaceId: wp.id,
                                  title,
                                })
                                setShowingNavigator(false)
                              },
                            }
                          )
                        }

                        return createDoc(team, {
                          workspaceId: personalWorkspace!.id,
                          title,
                        })
                      },
                    })
                  },
                },
                {
                  type: MenuTypes.Normal,
                  icon: mdiFolderPlusOutline,
                  label: 'Create Folder',
                  onClick: () => {
                    openCreateForm({
                      placeholder: 'Folder name...',
                      onSubmit: (folderName) => {
                        if (personalWorkspace == null) {
                          return createWorkspace(
                            team,
                            {
                              personal: true,
                              name: 'Private',
                              permissions: [],
                              public: false,
                            },
                            {
                              skipRedirect: true,
                              afterSuccess: (wp) =>
                                createFolder(team, {
                                  workspaceId: wp.id,
                                  description: '',
                                  folderName,
                                }),
                            }
                          )
                        }

                        return createFolder(team, {
                          workspaceId: personalWorkspace!.id,
                          description: '',
                          folderName,
                        })
                      },
                    })
                  },
                },
              ] as MenuItem[])
            },
          },
        ],
      })
    }

    if (labels.length > 0) {
      tree.push({
        label: 'Labels',
        rows: labels,
      })
    }

    tree.push({
      label: 'More',
      rows: [
        {
          id: 'sidenav-shared',
          label: 'Shared',
          defaultIcon: mdiWeb,
          href: getTeamLinkHref(team, 'shared'),
          active: getTeamLinkHref(team, 'shared') === pathname,
          navigateTo: () => {
            setShowingNavigator(false)
            push(getTeamLinkHref(team, 'shared'))
          },
          depth: 0,
        },
      ],
    })

    tree.push({
      label: 'Status',
      rows: [
        {
          id: 'sidenav-status-in-progress',
          label: 'In Progress',
          defaultIcon: mdiPlayCircleOutline,
          href: getDocStatusHref(team, 'in-progress'),
          active: getDocStatusHref(team, 'in-progress') === pathname,
          navigateTo: () => {
            setShowingNavigator(false)
            push(getDocStatusHref(team, 'in-progress'))
          },
          depth: 0,
        },
        {
          id: 'sidenav-status-paused',
          label: 'Paused',
          defaultIcon: mdiPauseCircleOutline,
          href: getDocStatusHref(team, 'paused'),
          active: getDocStatusHref(team, 'paused') === pathname,
          navigateTo: () => {
            setShowingNavigator(false)
            push(getDocStatusHref(team, 'paused'))
          },
          depth: 0,
        },
        {
          id: 'sidenav-status-completed',
          label: 'Completed',
          defaultIcon: mdiCheckCircleOutline,
          href: getDocStatusHref(team, 'completed'),
          active: getDocStatusHref(team, 'completed') === pathname,
          navigateTo: () => {
            setShowingNavigator(false)
            push(getDocStatusHref(team, 'completed'))
          },
          depth: 0,
        },
        {
          id: 'sidenav-status-archived',
          label: 'Archived',
          defaultIcon: mdiArchiveOutline,
          href: getDocStatusHref(team, 'archived'),
          active: getDocStatusHref(team, 'archived') === pathname,
          navigateTo: () => {
            setShowingNavigator(false)
            push(getDocStatusHref(team, 'archived'))
          },
          depth: 0,
        },
      ],
    })

    tree.forEach((category) => {
      const key = (category.label || '').toLocaleLowerCase()
      const foldKey = `fold-${key}`
      const hideKey = `hide-${key}`
      category.folded = sideBarOpenedLinksIdsSet.has(foldKey)
      category.folding = getFoldEvents('links', foldKey, true)
      category.hidden = sideBarOpenedLinksIdsSet.has(hideKey)
      category.toggleHidden = () => toggleItem('links', hideKey)
    })

    return tree as NavigatorCategory[]
  }, [
    initialLoadDone,
    team,
    pathname,
    preferences.navigatorTreeSortingOrder,
    docsMap,
    foldersMap,
    workspacesMap,
    smartFoldersMap,
    tagsMap,
    currentUserIsCoreMember,
    sideBarOpenedWorkspaceIdsSet,
    getFoldEvents,
    popup,
    createDoc,
    createFolder,
    openWorkspaceEditForm,
    deleteWorkspace,
    setShowingNavigator,
    push,
    sideBarOpenedFolderIdsSet,
    toggleFolderBookmark,
    treeSendingMap,
    toggleDocBookmark,
    openRenameFolderForm,
    deleteFolder,
    openRenameDocForm,
    deleteDoc,
    openModal,
    messageBox,
    deleteSmartFolder,
    createWorkspace,
    sideBarOpenedLinksIdsSet,
    toggleItem,
  ])

  const treeWithOrderedCategories = useMemo(() => {
    if (tree == null) {
      return undefined
    }

    const orderedCategories = Array.from(
      new Set([
        ...preferences.sidebarOrderedCategories.split(
          cloudSidebarOrderedCategoriesDelimiter
        ),
        ...cloudSidebaCategoryLabels,
      ])
    ).filter((item) =>
      cloudSidebaCategoryLabels.find((categoryLabel) => categoryLabel === item)
    )

    const orderedTree = tree.sort((categoryA, categoryB) => {
      if (
        orderedCategories.indexOf(categoryA.label) >
        orderedCategories.indexOf(categoryB.label)
      ) {
        return 1
      } else {
        return -1
      }
    })

    return orderedTree
  }, [tree, preferences.sidebarOrderedCategories])

  return {
    tree,
    treeWithOrderedCategories,
  }
}

function buildChildrenNavRows(
  sortingOrder: SidebarTreeSortingOrder,
  childrenIds: string[],
  depth: number,
  map: Map<string, CloudTreeItem>
) {
  const rows = childrenIds.reduce((acc, childId) => {
    const childRow = map.get(childId)
    if (childRow == null) {
      return acc
    }

    if (childRow.archived) {
      return acc
    }

    acc.push({
      ...childRow,
      depth,
      rows: buildChildrenNavRows(
        sortingOrder,
        childRow.children,
        depth + 1,
        map
      ),
    })

    return acc
  }, [] as (NavigatorRow & { lastUpdated: string })[])

  switch (sortingOrder) {
    case 'a-z':
      return sortByAttributeAsc('label', rows)
    case 'z-a':
      return sortByAttributeDesc('label', rows)
    case 'last-updated':
      return sortByAttributeDesc('lastUpdated', rows)
    case 'drag':
    default:
      return rows
  }
}

interface CloudTreeItem {
  id: string
  parentId?: string
  label: string
  defaultIcon?: string
  emoji?: string
  hidden?: boolean
  bookmarked?: boolean
  archived?: boolean
  children: string[]
  folding?: FoldingProps
  folded?: boolean
  href?: string
  active?: boolean
  lastUpdated: string
  navigateTo?: () => void
  tooltip?: string
  controls?: {
    icon: string
    onClick: (
      event: MouseEvent<HTMLButtonElement>,
      openCreateForm: (params: {
        onSubmit: (value: string) => any
        placeholder?: string
      }) => Promise<void>
    ) => void
  }[]
  contextControls?: MenuItem[]
}

export interface NavigatorRow {
  id: string
  emoji?: string
  defaultIcon?: string
  label: string
  depth: number
  href?: string
  active?: boolean
  rows?: NavigatorRow[]
  navigateTo?: () => void
  controls?: NavigatorControl[]
  contextControls?: MenuItem[]

  folded?: boolean
  folding?: FoldingProps
}

export interface NavigatorControl {
  icon: string
  onClick: (
    event: MouseEvent<HTMLButtonElement>,
    openCreateForm: (params: {
      onSubmit: (value: string) => any
      placeholder?: string
    }) => Promise<void>
  ) => void
  disabled?: boolean
}

export interface NavigatorCategory {
  label: string
  folded: boolean
  controls?: NavigatorControl[]
  hidden: boolean
  toggleHidden: () => void
  folding?: FoldingProps
  rows: NavigatorRow[]
  contextControls?: MenuItem[]
  footer?: React.ReactNode
  lastCategory?: boolean
}
