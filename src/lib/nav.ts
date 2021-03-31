export function getNoteFullItemId(
  storageId: string,
  pathname: string,
  noteId: string
) {
  const notePathname = pathname.startsWith('/')
    ? pathname.substring(1)
    : pathname
  return `/app/storages/${storageId}/notes/${notePathname}${
    notePathname === '' ? '' : '/'
  }note:${noteId}`
}

export function getStorageItemId(storageId: string) {
  return `storage:${storageId}`
}

export function getFolderItemId(storageId: string, folderPathname: string) {
  return `${getStorageItemId(storageId)}/folder:${folderPathname}`
}

export function getTagListItemId(storageId: string) {
  return `${getStorageItemId(storageId)}/tags`
}

export const bookmarkItemId = 'bookmarks'
