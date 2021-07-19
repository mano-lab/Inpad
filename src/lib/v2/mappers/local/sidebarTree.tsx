import {
  getMapValues,
  sortByAttributeAsc,
  sortByAttributeDesc,
} from '../../../../shared/lib/utils/array'
import {
  mdiArchiveOutline,
  mdiExport,
  mdiFileDocumentOutline,
  mdiTextBoxPlus,
  mdiFolderPlusOutline,
  mdiPaperclip,
  mdiPencil,
  mdiSortAlphabeticalAscending,
  mdiSortAlphabeticalDescending,
  mdiSortClockAscending,
  mdiStar,
  mdiStarOutline,
  mdiTag,
  mdiTrashCanOutline,
} from '@mdi/js'
import { MenuItem, MenuTypes } from '../../../../shared/lib/stores/contextMenu'
import { SidebarDragState } from '../../../../shared/lib/dnd'
import React from 'react'
import {
  FolderDoc,
  NoteDoc,
  NoteStorage,
  ObjectMap,
  TagDoc,
} from '../../../db/types'
import { FoldingProps } from '../../../../shared/components/atoms/FoldingWrapper'
import {
  getArchiveHref,
  getAttachmentsHref,
  getDocHref,
  getFolderHref,
  getFolderName,
  getFolderPathname,
  getLabelHref,
  getNoteTitle,
  getParentFolderPathname,
  getTagName,
  getWorkspaceHref,
  isDirectSubPathname,
  values,
} from '../../../db/utils'
import { SidebarTreeSortingOrder } from '../../../../shared/lib/sidebar'
import {
  CreateFolderRequestBody,
  CreateNoteRequestBody,
} from '../../hooks/local/useLocalDB'
import { NavResource } from '../../interfaces/resources'
import { CollapsableType } from '../../stores/sidebarCollapse'
import { LocalExportResourceRequestBody } from '../../hooks/local/useLocalUI'
import {
  SidebarNavCategory,
  SidebarNavControls,
  SidebarTreeChildRow,
} from '../../../../shared/components/organisms/Sidebar/molecules/SidebarTree'

type LocalTreeItem = {
  id: string
  parentId?: string
  label: string
  defaultIcon?: string
  emoji?: string
  bookmarked?: boolean
  trashed?: boolean
  children: string[]
  folding?: FoldingProps
  folded?: boolean
  href?: string
  active?: boolean
  lastUpdated?: string // could be calculated for workspace as any last updated
  navigateTo?: () => void
  controls?: SidebarNavControls[]
  contextControls?: MenuItem[]
  dropIn?: boolean
  dropAround?: boolean
  onDragStart?: () => void
  onDrop?: (position?: SidebarDragState) => void
}

function getWorkspaceChildrenOrdered(
  sortingOrder: SidebarTreeSortingOrder,
  workspaceRows: LocalTreeItem[]
): LocalTreeItem[] {
  const compare = (a: LocalTreeItem, b: LocalTreeItem) => {
    return ~~b.id.startsWith('folder') - ~~a.id.startsWith('folder')
  }
  switch (sortingOrder) {
    case 'a-z':
      return sortByAttributeAsc('label', workspaceRows).sort(compare)
    case 'z-a':
      return sortByAttributeDesc('label', workspaceRows).sort(compare)
    case 'last-updated':
      return sortByAttributeDesc('lastUpdated', workspaceRows).sort(compare)
    case 'drag':
    default:
      return workspaceRows
    // todo: [komediruzecki-09/06/2021] Implement drag and drop (ordered Ids)
  }
}

function getFolderChildrenOrderedIds(
  parentFolder: FolderDoc,
  notes: NoteDoc[],
  folders: FolderDoc[]
): string[] {
  const children: string[] = []
  const parentFolderPathname = getFolderPathname(parentFolder._id)
  notes.forEach((note) => {
    if (note.folderPathname == parentFolderPathname) {
      children.push(note._id)
    }
  })

  folders.forEach((folder) => {
    const folderPathname = getFolderPathname(folder._id)
    if (isDirectSubPathname(parentFolderPathname, folderPathname)) {
      children.push(folder._id)
    }
  })

  return children
}

export function mapTreeControls(
  workspace: NoteStorage,
  exportDocuments: (
    workspace: NoteStorage,
    exportSettings: LocalExportResourceRequestBody
  ) => void
) {
  if (workspace == null) {
    return []
  }
  return [
    {
      type: MenuTypes.Normal,
      label: 'Export Folder',
      icon: mdiExport,
      onClick: () =>
        exportDocuments(workspace, {
          folderName: workspace.name,
          folderPathname: '/',
          exportingStorage: true,
        }),
    },
  ] as MenuItem[]
}

export function mapTree(
  initialLoadDone: boolean,
  sortingOrder: SidebarTreeSortingOrder,
  workspace: NoteStorage,
  docMap: ObjectMap<NoteDoc>,
  folderMap: ObjectMap<FolderDoc>,
  labelMap: ObjectMap<TagDoc>,
  currentRouterPath: string,
  sideBarOpenedLinksIdsSet: Set<string>,
  sideBarOpenedFolderIdsSet: Set<string>,
  toggleItem: (type: CollapsableType, id: string) => void,
  getFoldEvents: (type: CollapsableType, key: string) => FoldingProps,
  push: (url: string) => void,
  toggleNoteBookmark: (
    workspaceId: string,
    docId: string,
    bookmarked: boolean
  ) => void,
  toggleNoteArchived: (
    workspaceId: string,
    docId: string,
    archived: boolean
  ) => void,
  deleteFolder: (target: {
    workspaceId: string
    pathname: string
  }) => Promise<void>,
  createFolder: (body: CreateFolderRequestBody) => Promise<void>,
  createNote: (body: CreateNoteRequestBody) => Promise<void>,
  draggedResource: React.MutableRefObject<NavResource | undefined>,
  dropInFolderOrDoc: (
    workspaceId: string,
    targetedResource: NavResource,
    targetedPosition: SidebarDragState
  ) => void,
  openRenameFolderForm: (workspaceId: string, folder: FolderDoc) => void,
  openRenameNoteForm: (workspaceId: string, doc: NoteDoc) => void,
  exportDocuments: (
    workspace: NoteStorage,
    exportSettings: LocalExportResourceRequestBody
  ) => void
): SidebarNavCategory[] | undefined {
  if (!initialLoadDone || workspace == null) {
    return undefined
  }

  const currentPathWithWorkspace = `${getWorkspaceHref(
    workspace
  )}/${currentRouterPath}`
  const items = new Map<string, LocalTreeItem>()
  const [notes, folders] = [values(docMap), values(folderMap)]

  folders.forEach((folder) => {
    const folderId = folder._id
    const folderPathname = getFolderPathname(folderId)
    if (folderPathname == '/') {
      return
    }
    const folderName = getFolderName(folder, workspace.name)
    const parentFolderPathname = getParentFolderPathname(folderPathname)
    const href = getFolderHref(folder, workspace.id)
    const parentFolderDoc = folderMap[parentFolderPathname]
    const parentFolderId =
      parentFolderDoc != null && parentFolderPathname != '/'
        ? parentFolderDoc._id
        : workspace.id
    items.set(folderId, {
      id: folderId,
      lastUpdated: folder.updatedAt,
      label: folderName,
      folded: !sideBarOpenedFolderIdsSet.has(folderId),
      folding: getFoldEvents('folders', folderId),
      href,
      active: href === currentPathWithWorkspace,
      navigateTo: () => push(href),
      onDrop: (position: SidebarDragState) =>
        dropInFolderOrDoc(
          workspace.id,
          { type: 'folder', result: folder },
          position
        ),
      onDragStart: () => {
        draggedResource.current = { type: 'folder', result: folder }
      },
      dropIn: true,
      dropAround: sortingOrder === 'drag',
      controls: [
        {
          icon: mdiTextBoxPlus,
          onClick: undefined,
          placeholder: 'Note title..',
          create: (title: string) =>
            createNote({
              workspaceId: workspace.id,
              docProps: {
                title: title,
                folderPathname: folderPathname,
              },
            }),
        },
        {
          icon: mdiFolderPlusOutline,
          onClick: undefined,
          placeholder: 'Folder name..',
          create: (folderName: string) =>
            createFolder({
              workspaceId: workspace.id,
              destinationPathname: folderPathname,
              folderName: folderName,
            }),
        },
      ],

      contextControls: [
        // todo: no control for bookmark for now (add bookmarked property to folder DB)
        // {
        // type: MenuTypes.Normal,
        // icon: folder.bookmarked ? mdiStar : mdiStarOutline,
        // label:
        //   treeSendingMap.get(folderId) === 'bookmark'
        //     ? '...'
        //     : folder.bookmarked
        //     ? 'Bookmarked'
        //     : 'Bookmark',
        // onClick: () =>
        //   toggleFolderBookmark(folder.teamId, folder.id, folder.bookmarked),
        // },
        {
          type: MenuTypes.Normal,
          icon: mdiPencil,
          label: 'Rename',
          onClick: () => openRenameFolderForm(workspace.id, folder),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiTrashCanOutline,
          label: 'Delete',
          onClick: () =>
            deleteFolder({
              workspaceId: workspace.id,
              pathname: folderPathname,
            }),
        },
        {
          type: MenuTypes.Normal,
          label: 'Export Folder',
          icon: mdiExport,
          onClick: () =>
            exportDocuments(workspace, {
              folderName,
              folderPathname,
              exportingStorage: false,
            }),
        },
      ],
      parentId: parentFolderId,
      children: getFolderChildrenOrderedIds(folder, notes, folders),
    })
  })

  notes.forEach((doc) => {
    if (doc.trashed) {
      return
    }
    const noteId = doc._id
    const href = getDocHref(doc, workspace.id)
    const bookmarked = !!doc.data.bookmarked
    const parentFolderDoc = workspace.folderMap[doc.folderPathname]
    const parentNoteId =
      parentFolderDoc != null
        ? parentFolderDoc.pathname == '/'
          ? workspace.id
          : parentFolderDoc._id
        : workspace.id
    items.set(noteId, {
      id: noteId,
      lastUpdated: doc.updatedAt, // doc.head != null ? doc.head.created : doc.updatedAt,
      label: getNoteTitle(doc, 'Untitled'),
      bookmarked: bookmarked,
      defaultIcon: mdiFileDocumentOutline,
      trashed: doc.trashed,
      children: [],
      href,
      active: href === currentPathWithWorkspace,
      dropAround: sortingOrder === 'drag',
      navigateTo: () => push(href),
      onDrop: (position: SidebarDragState) =>
        dropInFolderOrDoc(workspace.id, { type: 'doc', result: doc }, position),
      onDragStart: () => {
        draggedResource.current = { type: 'doc', result: doc }
      },
      contextControls: [
        {
          type: MenuTypes.Normal,
          icon: bookmarked ? mdiStar : mdiStarOutline,
          label: bookmarked ? 'Bookmarked' : 'Bookmark',
          onClick: () => toggleNoteBookmark(workspace.id, noteId, bookmarked),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiPencil,
          label: 'Rename',
          onClick: () => openRenameNoteForm(workspace.id, doc),
        },
        {
          type: MenuTypes.Normal,
          icon: mdiArchiveOutline,
          label: doc.trashed ? 'Restore' : 'Archive',
          onClick: () => toggleNoteArchived(workspace.id, noteId, doc.trashed),
        },
      ],
      parentId: parentNoteId,
    })
  })

  const arrayItems = getMapValues(items)
  const tree: Partial<SidebarNavCategory>[] = []

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
    })
    return acc
  }, [] as SidebarTreeChildRow[])

  const workspaceRows = arrayItems.filter(
    (item) => item.parentId == workspace.id
  )
  const orderedWorkspaceRows = getWorkspaceChildrenOrdered(
    sortingOrder,
    workspaceRows
  )
  const navTree = orderedWorkspaceRows.reduce((acc, val) => {
    acc.push({
      ...val,
      depth: 0,
      rows: buildChildrenNavRows(sortingOrder, val.children, 1, items),
    })
    return acc
  }, [] as SidebarTreeChildRow[])

  const notesPerLabelIdMap = notes.reduce((acc, note) => {
    const noteLabelNames = note.tags || []
    noteLabelNames.forEach((tagName) => {
      const label = labelMap[tagName]
      if (label) {
        let noteIds = acc.get(label._id)
        if (noteIds == null) {
          noteIds = []
          acc.set(label._id, noteIds)
        }
        noteIds.push(note._id)
      }
    })
    return acc
  }, new Map<string, string[]>())

  const labels = values(labelMap)
    .filter((tag) => (notesPerLabelIdMap.get(tag._id) || []).length > 0)
    .sort((a, b) => {
      if (a._id < b._id) {
        // tag._id == tagName
        return -1
      } else {
        return 1
      }
    })
    .reduce((acc, val) => {
      const tagName = getTagName(val._id)
      const href = getLabelHref(workspace, tagName)
      acc.push({
        id: val._id,
        depth: 0,
        label: tagName,
        defaultIcon: mdiTag,
        href,
        active: href === currentPathWithWorkspace,
        navigateTo: () => push(href),
      })
      return acc
    }, [] as SidebarTreeChildRow[])

  if (bookmarked.length > 0) {
    tree.push({
      label: 'Bookmarks',
      rows: bookmarked,
    })
  }
  tree.push({
    label: 'Folder',
    rows: navTree,
    controls: [
      {
        icon: mdiTextBoxPlus,
        onClick: undefined,
        placeholder: 'Note title..',
        create: (title: string) =>
          createNote({
            workspaceId: workspace.id,
            docProps: { title: title },
          }),
      },
      {
        icon: mdiFolderPlusOutline,
        onClick: undefined,
        placeholder: 'Folder name..',
        create: (folderName: string) =>
          createFolder({
            workspaceId: workspace.id,
            folderName: folderName,
            destinationPathname: '/',
          }),
      },
    ],
    contextControls: mapTreeControls(workspace, exportDocuments),
  })
  if (labels.length > 0) {
    tree.push({
      label: 'Labels',
      rows: labels,
    })
  }

  const attachmentsHref = getAttachmentsHref(workspace)
  const archiveHref = getArchiveHref(workspace)
  tree.push({
    label: 'More',
    rows: [
      {
        id: 'sidenav-attachment-local',
        label: 'Attachments',
        defaultIcon: mdiPaperclip,
        href: attachmentsHref,
        active: attachmentsHref === currentPathWithWorkspace,
        navigateTo: () => push(attachmentsHref),
        depth: 0,
      },
      {
        id: 'sidenav-archived-local',
        label: 'Archive',
        defaultIcon: mdiArchiveOutline,
        href: archiveHref,
        active: archiveHref === currentPathWithWorkspace,
        navigateTo: () => push(archiveHref),
        depth: 0,
      },
    ],
  })

  tree.forEach((category) => {
    const key = (category.label || '').toLocaleLowerCase()
    const foldKey = `fold-${key}`
    const hideKey = `hide-${key}`
    category.folded = sideBarOpenedLinksIdsSet.has(foldKey)
    category.folding = getFoldEvents('links', foldKey)
    category.hidden = sideBarOpenedLinksIdsSet.has(hideKey)
    category.toggleHidden = () => toggleItem('links', hideKey)
  })
  return tree as SidebarNavCategory[]
}

function buildChildrenNavRows(
  sortingOrder: SidebarTreeSortingOrder,
  childrenIds: string[],
  depth: number,
  map: Map<string, LocalTreeItem>
) {
  const rows = childrenIds.reduce((acc, childId) => {
    const childRow = map.get(childId)
    if (childRow == null) {
      return acc
    }

    if (childRow.trashed) {
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
  }, [] as (SidebarTreeChildRow & { lastUpdated?: string })[])

  switch (sortingOrder) {
    case 'a-z':
      return sortByAttributeAsc('label', rows)
    case 'z-a':
      return sortByAttributeDesc('label', rows)
    case 'last-updated':
      return sortByAttributeDesc('lastUpdated', rows)
    case 'drag':
    // todo: [komediruzecki-05/06/2021] Implement dragged based order (orderedIds)
    default:
      return rows
  }
}

export const SidebarTreeSortingOrders = {
  lastUpdated: {
    value: 'last-updated',
    label: 'Last updated',
    icon: mdiSortClockAscending,
  },
  aZ: {
    value: 'a-z',
    label: 'Title A-Z',
    icon: mdiSortAlphabeticalAscending,
  },
  zA: {
    value: 'z-a',
    label: 'Title Z-A',
    icon: mdiSortAlphabeticalDescending,
  },
  // todo: [komediruzecki-05/06/2021] Enable once implemented (or use shared one)
  // dragDrop: {
  //   value: 'drag',
  //   label: 'Drag and drop',
  //   icon: mdiMouseMoveDown,
  // },
} as {
  [title: string]: {
    value: SidebarTreeSortingOrder
    label: string
    icon: string
  }
}
