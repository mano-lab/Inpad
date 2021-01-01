import React, { useMemo } from 'react'
import { NoteStorage } from '../../lib/db/types'
import { usePathnameWithoutNoteId } from '../../lib/routeParams'
import { useGeneralStatus } from '../../lib/generalStatus'
import { getFolderItemId } from '../../lib/nav'
import FolderNavigatorItem from './FolderNavigatorItem'

interface FolderListFragmentProps {
  storage: NoteStorage
  createNoteInFolderAndRedirect: (folderPathname: string) => void
  showPromptToCreateFolder: (folderPathname: string) => void
  showPromptToRenameFolder: (folderPathname: string) => void
}

const FolderListFragment = ({
  storage,
  showPromptToCreateFolder,
  showPromptToRenameFolder,
  createNoteInFolderAndRedirect,
}: FolderListFragmentProps) => {
  const { folderMap, id: storageId } = storage

  const { sideNavOpenedItemSet } = useGeneralStatus()

  const currentPathnameWithoutNoteId = usePathnameWithoutNoteId()

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

  const openedFolderPathnameList = useMemo(() => {
    const tree = getFolderNameElementTree(folderPathnames)
    return getOpenedFolderPathnameList(
      tree,
      storageId,
      sideNavOpenedItemSet,
      '/'
    )
  }, [folderPathnames, storageId, sideNavOpenedItemSet])

  const getFolderNoteCount = (folderPathname: string): number =>
    Object.values(storage.noteMap).filter(
      (note) =>
        (!note!.trashed && note!.folderPathname === folderPathname) ||
        note!.folderPathname.startsWith(folderPathname + '/')
    ).length

  return (
    <>
      {openedFolderPathnameList.map((item) => {
        return (
          <FolderNavigatorItem
            key={`folder:${item.pathname}`}
            active={
              currentPathnameWithoutNoteId ===
              `/app/storages/${storageId}/notes${item.pathname}`
            }
            storageId={storage.id}
            depth={item.depth}
            folderName={item.name}
            folderPathname={item.pathname}
            folderSetWithSubFolders={folderSetWithSubFolders}
            noteCount={getFolderNoteCount(folderPathname)}
            createNoteInFolderAndRedirect={createNoteInFolderAndRedirect}
            showPromptToCreateFolder={showPromptToCreateFolder}
            showPromptToRenameFolder={showPromptToRenameFolder}
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
  name: string
  pathname: string
  depth: number
}

function getOpenedFolderPathnameList(
  tree: {},
  storageId: string,
  openItemIdSet: Set<string>,
  parentPathname: string
): FolderNavItem[] {
  const names = Object.keys(tree)
  const pathnameList: FolderNavItem[] = []
  for (const name of names) {
    const pathname =
      parentPathname === '/' ? `/${name}` : `${parentPathname}/${name}`
    if (pathname === '/') {
      continue
    }
    const depth = pathname.split('/').slice(0).length - 1
    pathnameList.push({
      name,
      pathname,
      depth,
    })
    if (openItemIdSet.has(getFolderItemId(storageId, pathname))) {
      pathnameList.push(
        ...getOpenedFolderPathnameList(
          tree[name],
          storageId,
          openItemIdSet,
          pathname
        )
      )
    }
  }
  return pathnameList
}

export default FolderListFragment
