import { NOTE_ID_PREFIX, FOLDER_ID_PREFIX, TAG_ID_PREFIX } from './consts'
import { join } from 'path'
import {
  ObjectMap,
  NoteDoc,
  FolderDoc,
  TagDoc,
  PouchNoteStorageData,
  NoteStorage,
  PopulatedTagDoc,
  NoteStorageData,
  LiteStorageStorageItem,
} from './types'
import { generateId, escapeRegExp } from '../string'

export function values<T>(objectMap: ObjectMap<T>): T[] {
  return Object.values(objectMap) as T[]
}

export function entries<T>(objectMap: ObjectMap<T>): [string, T][] {
  return Object.entries(objectMap) as [string, T][]
}

export function keys(objectMap: ObjectMap<any>): string[] {
  return Object.keys(objectMap)
}

export function getNow(): string {
  return new Date().toISOString()
}

export function generateNoteId(): string {
  return `${NOTE_ID_PREFIX}${generateId()}`
}

export function generateFolderId(): string {
  return `${FOLDER_ID_PREFIX}${generateId()}`
}

export function excludeNoteIdPrefix(noteId: string): string {
  return noteId.replace(new RegExp(`^${NOTE_ID_PREFIX}`), '')
}

export function excludeFileProtocol(src: string) {
  return src.replace('file://', '')
}

export function prependFolderIdPrefix(folderPathname: string): string {
  if (new RegExp(`^${FOLDER_ID_PREFIX}`).test(folderPathname)) {
    return folderPathname
  }
  return `${FOLDER_ID_PREFIX}${folderPathname}`
}

export function getWorkspaceHref(storage: NoteStorage, query?: any): string {
  return `/app/storages/${storage.id}?${query}`
}

export function getTimelineHref(storage: NoteStorage, query?: any): string {
  return `/app/storages/${storage.id}/timeline${
    query != null ? `?${query}` : ''
  }`
}

export function getArchiveHref(storage: NoteStorage): string {
  return `/app/storages/${storage.id}/archive`
}

export function getLabelHref(
  storage: NoteStorage,
  tagName: string,
  noteId?: string
): string {
  if (noteId != null) {
    return `/app/storages/${storage.id}/tags/${tagName}/${noteId}`
  }
  return `/app/storages/${storage.id}/tags/${tagName}`
}

export function getAttachmentsHref(storage: NoteStorage): string {
  return `/app/storages/${storage.id}/attachments`
}

export function getNoteTitle(note: NoteDoc, fallback: string) {
  return note.title != '' ? note.title : fallback
}

export function getDocHref(note: NoteDoc, storageId: string) {
  return getDocHrefRaw(note._id, storageId)
}

export function getDocHrefRaw(noteId: string, storageId: string) {
  return `/app/storages/${storageId}/notes/${noteId}`
}

export function getFolderName(
  folderDoc: FolderDoc,
  fallback = 'Untitled'
): string {
  const folderName = getFolderNameFromPathname(getFolderPathname(folderDoc._id))
  if (folderName != null) {
    return folderName
  }
  return fallback
}

export function getFolderId(pathname: string): string {
  return `${FOLDER_ID_PREFIX}${pathname}`
}

export function getFolderPathname(id: string): string {
  return id.substring(FOLDER_ID_PREFIX.length)
}

export function getParentFolderPathname(pathname: string): string {
  return join(pathname, '..')
}

export function getFolderNameFromPathname(pathname: string): string | null {
  if (pathname === '/') return null
  return pathname.split('/').slice(-1)[0]
}

export function getFolderHref(
  folder: FolderDoc,
  storageId: string,
  query?: any
): string {
  const folderPathname = getFolderPathname(folder._id)
  return `/app/storages/${storageId}/${
    folderPathname == '/'
      ? ''
      : 'notes' + folderPathname + `${query != null ? '?' + query : ''}`
  }`
}

export function getTagId(name: string): string {
  return `${TAG_ID_PREFIX}${name}`
}

export function getTagName(id: string): string {
  return id.substring(TAG_ID_PREFIX.length)
}

export function isFolderNameValid(name: string): boolean {
  if (name.length === 0) return false
  return !/[<>:"\/\\|?*\x00-\x1F]/g.test(name)
}

export function isFolderPathnameValid(pathname: string): boolean {
  if (pathname === '/') return true
  if (!pathname.startsWith('/')) return false
  const [, ...folderNames] = pathname.split('/')
  return folderNames.every(isFolderNameValid)
}

export function isTagNameValid(name: string): boolean {
  if (name.length === 0) return false
  return !/[\s#<>:"\/\\|?*\x00-\x1F]/g.test(name)
}

export function isSubPathname(rootPathname: string, targetPathname: string) {
  return new RegExp(`^${escapeRegExp(rootPathname)}/.+`).test(targetPathname)
}

export function isDirectSubPathname(
  rootPathname: string,
  targetPathname: string
) {
  return new RegExp(
    `^${
      rootPathname === '/' ? '' : escapeRegExp(rootPathname)
    }/[^<>:"\/\\|?*\x00-\x1F]+$`
  ).test(targetPathname)
}

enum DbClientErrorCode {
  UnprocessableEntity = 'UnprocessableEntity',
  Conflict = 'Conflict',
  NotFound = 'NotFound',
}

export class DbClientError extends Error {
  readonly name: string = 'DbClientError'
  code: DbClientErrorCode
  statusCode: number
  constructor(message: string, code: DbClientErrorCode) {
    super(message)
    this.code = code
    this.statusCode = getStatusCodeFromCode(code)
  }
}

export function getStatusCodeFromCode(code: string) {
  switch (code) {
    case DbClientErrorCode.NotFound:
      return 404
    case DbClientErrorCode.Conflict:
      return 409
    case DbClientErrorCode.UnprocessableEntity:
      return 422
  }

  return 500
}

export function createUnprocessableEntityError(message: string) {
  return new DbClientError(message, DbClientErrorCode.UnprocessableEntity)
}

export function createNotFoundError(message: string) {
  return new DbClientError(message, DbClientErrorCode.NotFound)
}

export function createConflictError(message: string) {
  return new DbClientError(message, DbClientErrorCode.Conflict)
}

export function isNoteDoc(
  doc: PouchDB.Core.ExistingDocument<any>
): doc is NoteDoc {
  return doc._id.startsWith(NOTE_ID_PREFIX)
}

export function isFolderDoc(
  doc: PouchDB.Core.ExistingDocument<any>
): doc is FolderDoc {
  return doc._id.startsWith(FOLDER_ID_PREFIX)
}

export function isTagDoc(
  doc: PouchDB.Core.ExistingDocument<any>
): doc is TagDoc {
  return doc._id.startsWith(TAG_ID_PREFIX)
}

export function getAllParentFolderPathnames(pathname: string) {
  const pathnames = []
  let currentPathname = pathname
  do {
    currentPathname = getParentFolderPathname(currentPathname)
    if (currentPathname !== '/') {
      pathnames.push(currentPathname)
    }
  } while (currentPathname !== '/')
  return pathnames
}

export function isCloudStorageData(
  data: PouchNoteStorageData
): data is Required<PouchNoteStorageData> {
  return data.cloudStorage != null
}

export function normalizeTagColor(tag: PopulatedTagDoc): string {
  return typeof tag.data.color == 'string' ? tag.data.color : ''
}

export function mapStorageToLiteStorageData(
  storage: NoteStorage | NoteStorageData
): LiteStorageStorageItem {
  const { id, name } = storage
  if (storage.type === 'fs') {
    return {
      id,
      name,
      type: 'fs',
      location: storage.location,
    }
  }
  return {
    id,
    name,
    cloudStorage: storage.cloudStorage,
  }
}
