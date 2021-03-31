import React, { useMemo } from 'react'
import {
  NoteStorage,
  NoteDoc,
  PopulatedFolderDoc,
  ObjectMap,
  NoteDocEditibleProps,
} from '../../lib/db/types'
import { useRouteParams, StorageNotesRouteParams } from '../../lib/routeParams'
import { useGeneralStatus } from '../../lib/generalStatus'
import { getFolderItemId } from '../../lib/nav'
import FolderNavigatorItem from './FolderNavigatorItem'
import NoteNavigatorItem from './NoteNavigatorItem'

interface FolderNoteNavigatorFragment {
  storage: NoteStorage
  createNoteInFolderAndRedirect: (folderPathname: string) => void
  showPromptToCreateFolder: (folderPathname: string) => void
  showPromptToRenameFolder: (folderPathname: string) => void
  bookmarkNote: (
    storageId: string,
    noteId: string
  ) => Promise<NoteDoc | undefined>
  unbookmarkNote: (
    storageId: string,
    noteId: string
  ) => Promise<NoteDoc | undefined>
  trashNote: (storageId: string, noteId: string) => Promise<NoteDoc | undefined>
  copyNoteLink: (
    storageId: string,
    noteId: string,
    noteProps: Partial<NoteDocEditibleProps>
  ) => Promise<string | undefined>
}

const FolderNoteNavigatorFragment = ({
  storage,
  showPromptToCreateFolder,
  showPromptToRenameFolder,
  createNoteInFolderAndRedirect,
  bookmarkNote,
  unbookmarkNote,
  trashNote,
  copyNoteLink,
}: FolderNoteNavigatorFragment) => {
  const { folderMap, id: storageId } = storage

  const { sideNavOpenedItemSet } = useGeneralStatus()

  const routeParams = useRouteParams() as StorageNotesRouteParams

  const folderPathnames = useMemo(() => {
    return Object.keys(folderMap).sort((a, b) => a.localeCompare(b))
  }, [folderMap])

  const folderSetWithSubFolders = useMemo(() => {
    return folderPathnames.reduce((folderSet, folderPathname) => {
      if (folderPathname !== '/') {
        const nameElements = folderPathname.slice(1).split('/')
        const parentFolderPathname =
          '/' + nameElements.slice(0, nameElements.length - 1).join('/')
        folderSet.add(parentFolderPathname)
      }
      return folderSet
    }, new Set<string>())
  }, [folderPathnames])

  const openedNavItemList = useMemo(() => {
    const tree = getFolderNameElementTree(folderPathnames)
    const navItemList = getOpenedFolderPathnameList(
      tree,
      storageId,
      sideNavOpenedItemSet,
      '/',
      storage.folderMap,
      storage.noteMap
    )
    const rootFolderNoteIds =
      storage.folderMap['/'] == null
        ? []
        : [...storage.folderMap['/'].noteIdSet] || []
    const rootFolderNotes = rootFolderNoteIds.reduce((list, noteId) => {
      const note = storage.noteMap[noteId]
      if (note != null) {
        list.push(note)
      }
      return list
    }, [] as NoteDoc[])
    rootFolderNotes
      .sort((a, b) => {
        if (a.title.trim() === '' && b.title.trim() !== '') {
          return 1
        }
        if (b.title.trim() === '' && a.title.trim() !== '') {
          return -1
        }
        return a.title.trim().localeCompare(b.title.trim())
      })
      .forEach((note) => {
        navItemList.push({
          type: 'note',
          id: note._id,
          title: note.title,
          folderPathname: note.folderPathname,
          bookmarked: !!note.data.bookmarked,
          depth: 0,
        })
      })
    return navItemList
  }, [
    folderPathnames,
    storageId,
    sideNavOpenedItemSet,
    storage.folderMap,
    storage.noteMap,
  ])

  return (
    <>
      {openedNavItemList.map((item) => {
        if (item.type === 'folder') {
          return (
            <FolderNavigatorItem
              key={`folder:${item.pathname}`}
              active={
                routeParams.noteId == null &&
                routeParams.folderPathname === item.pathname
              }
              folderName={item.name}
              depth={item.depth}
              storageId={storage.id}
              folderPathname={item.pathname}
              noteCount={item.noteCount}
              folderSetWithSubFolders={folderSetWithSubFolders}
              createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
              showPromptToCreateFolder={showPromptToCreateFolder}
              showPromptToRenameFolder={showPromptToRenameFolder}
            />
          )
        }

        return (
          <NoteNavigatorItem
            key={item.id}
            active={routeParams.noteId === item.id}
            storageId={storage.id}
            noteTitle={item.title}
            noteId={item.id}
            noteFolderPath={item.folderPathname}
            noteBookmarked={item.bookmarked}
            depth={item.depth}
            bookmarkNote={bookmarkNote}
            unbookmarkNote={unbookmarkNote}
            trashNote={trashNote}
            copyNoteLink={copyNoteLink}
          />
        )
      })}
    </>
  )
}

function getFolderNameElementTree(folderPathnameList: string[]) {
  return folderPathnameList.reduce((tree, folderPathname) => {
    const nameElements = folderPathname.slice(1).split('/')

    let targetTree = tree
    for (const nameElement of nameElements) {
      if (targetTree[nameElement] == null) {
        targetTree[nameElement] = {}
      }
      targetTree = targetTree[nameElement]
    }

    return tree
  }, {})
}

interface FolderNavItem {
  type: 'folder'
  name: string
  pathname: string
  noteCount: number
  depth: number
}

interface NoteNavItem {
  type: 'note'
  id: string
  title: string
  folderPathname: string
  depth: number
  bookmarked: boolean
}

type NavItem = FolderNavItem | NoteNavItem

function getOpenedFolderPathnameList(
  tree: {},
  storageId: string,
  openItemIdSet: Set<string>,
  parentPathname: string,
  folderMap: ObjectMap<PopulatedFolderDoc>,
  noteMap: ObjectMap<NoteDoc>
): NavItem[] {
  const names = Object.keys(tree)
  const itemList: NavItem[] = []
  for (const name of names) {
    const pathname =
      parentPathname === '/' ? `/${name}` : `${parentPathname}/${name}`
    if (pathname === '/') {
      continue
    }
    const folderDoc = folderMap[pathname]
    const noteCount = folderDoc?.noteIdSet.size || 0
    const nameElements = pathname.split('/').slice(1)
    const depth = nameElements.length - 1
    itemList.push({
      type: 'folder',
      pathname,
      name,
      depth,
      noteCount,
    })

    const folderIsOpened = openItemIdSet.has(
      getFolderItemId(storageId, pathname)
    )
    if (folderIsOpened) {
      itemList.push(
        ...getOpenedFolderPathnameList(
          tree[name],
          storageId,
          openItemIdSet,
          pathname,
          folderMap,
          noteMap
        )
      )

      if (folderIsOpened && folderDoc != null) {
        const noteIds = [...folderDoc.noteIdSet]
        const folderNotes = noteIds.reduce((list, noteId) => {
          const noteDoc = noteMap[noteId]
          if (noteDoc != null) {
            list.push(noteDoc)
          }
          return list
        }, [] as NoteDoc[])
        folderNotes
          .sort((a, b) => {
            if (a.title.trim() === '' && b.title.trim() !== '') {
              return 1
            }
            if (b.title.trim() === '' && a.title.trim() !== '') {
              return -1
            }
            return a.title.trim().localeCompare(b.title.trim())
          })
          .forEach((noteDoc) => {
            itemList.push({
              type: 'note',
              id: noteDoc._id,
              title: noteDoc.title,
              folderPathname: noteDoc.folderPathname,
              bookmarked: !!noteDoc.data.bookmarked,
              depth: depth + 1,
            })
          })
      }
    }
  }

  return itemList
}

export default FolderNoteNavigatorFragment
