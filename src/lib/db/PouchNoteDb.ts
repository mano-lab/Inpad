import dashify from 'dashify'
import parsePath from 'path-parse'
import {
  AllDocsMap,
  FolderDoc,
  FolderDocEditibleProps,
  TagDocEditibleProps,
  TagDoc,
  NoteDoc,
  NoteDocEditibleProps,
  ExceptRev,
  ObjectMap,
  Attachment,
  PopulatedFolderDoc,
} from './types'
import {
  getFolderId,
  createUnprocessableEntityError,
  isFolderPathnameValid,
  getParentFolderPathname,
  getTagId,
  isTagNameValid,
  generateNoteId,
  getNow,
  createNotFoundError,
  getFolderPathname,
  isNoteDoc,
  isFolderDoc,
  isTagDoc,
  getTagName,
  values,
  isSubPathname,
  generateFolderId,
} from './utils'
import { FOLDER_ID_PREFIX, ATTACHMENTS_ID } from './consts'
import NoteDb from './NoteDb'
import { escapeRegExp, getHexatrigesimalString } from '../string'

export default class PouchNoteDb implements NoteDb {
  type: 'pouch' = 'pouch'

  constructor(
    public pouchDb: PouchDB.Database,
    public id: string,
    public name: string
  ) {}

  async init() {
    await this.upsertNoteListViews()

    const { noteMap, tagMap } = await this.getAllDocsMap()
    const { missingPathnameSet, missingTagNameSet } = values(noteMap).reduce<{
      missingPathnameSet: Set<string>
      missingTagNameSet: Set<string>
    }>(
      (obj, noteDoc) => {
        if (noteDoc.trashed) {
          return obj
        }

        obj.missingPathnameSet.add(noteDoc.folderPathname)
        noteDoc.tags.forEach((tagName) => {
          if (tagMap[tagName] == null) {
            obj.missingTagNameSet.add(tagName)
          }
        })
        return obj
      },
      {
        missingPathnameSet: new Set(),
        missingTagNameSet: new Set(),
      }
    )

    await this.upsertFolder('/')

    await Promise.all([
      ...[...missingPathnameSet].map((pathname) => this.upsertFolder(pathname)),
      ...[...missingTagNameSet].map((tagName) => this.upsertTag(tagName)),
    ])
  }

  async getFolder(path: string): Promise<FolderDoc | null> {
    const doc = this.getDoc(getFolderId(path))
    return doc as any
  }

  async upsertFolder(
    pathname: string,
    props?: Partial<FolderDocEditibleProps>
  ): Promise<FolderDoc> {
    if (!isFolderPathnameValid(pathname)) {
      throw createUnprocessableEntityError(
        `pathname is invalid, got \`${pathname}\``
      )
    }
    if (pathname !== '/') {
      await this.doesParentFolderExistOrCreate(pathname)
    }
    const folder = await this.getFolder(pathname)
    if (folder != null && props == null) {
      return folder
    }
    const now = getNow()
    const folderDocProps = {
      ...(folder || {
        _realId: generateFolderId(),
        _id: getFolderId(pathname),
        createdAt: now,
        data: {},
      }),
      ...props,
      updatedAt: now,
    }
    const { rev } = await this.pouchDb.put(folderDocProps)

    return {
      _realId: folderDocProps._realId,
      _id: folderDocProps._id,
      createdAt: folderDocProps.createdAt,
      updatedAt: folderDocProps.updatedAt,
      data: folderDocProps.data,
      _rev: rev,
    }
  }

  async updateFolderOrderedIds(
    folderId: string,
    orderedIds: string[]
  ): Promise<FolderDoc | undefined> {
    console.warn(
      'Ordered IDs not supported in PouchDB' + folderId + ' ' + orderedIds
    )
    return undefined
  }

  async renameFolder(
    pathname: string,
    newPathname: string
  ): Promise<{
    folders: PopulatedFolderDoc[]
    notes: NoteDoc[]
    removedFolders: string[]
  }> {
    if (!isFolderPathnameValid(pathname)) {
      throw createUnprocessableEntityError(
        `pathname is invalid, got \`${pathname}\``
      )
    }
    if (!isFolderPathnameValid(newPathname)) {
      throw createUnprocessableEntityError(
        `pathname is invalid, got \`${newPathname}\``
      )
    }
    const folder = await this.getFolder(pathname)
    if (folder == null) {
      throw createUnprocessableEntityError(
        `The folder does not exist, \`${pathname}\``
      )
    }
    if (isSubPathname(pathname, newPathname)) {
      throw createUnprocessableEntityError(
        `The destination folder is a sub folder of the target folder.`
      )
    }
    const newFolder = await this.getFolder(newPathname)
    if (newFolder != null) {
      throw createUnprocessableEntityError(
        `The destination folder already exist, \`${newPathname}\``
      )
    }

    const updatedFolders: PopulatedFolderDoc[] = []
    const updatedNotes: NoteDoc[] = []

    const subFolders = await this.getAllFolderUnderPathname(pathname)
    const allFoldersToRename = [
      pathname,
      ...subFolders.map((folder) => getFolderPathname(folder._id)),
    ].sort()

    for (const folderPathname of allFoldersToRename) {
      const regex = new RegExp(`^${escapeRegExp(pathname)}`, 'g')
      const destinationPathname = folderPathname.replace(regex, newPathname)
      const notes = await this.findNotesByFolder(folderPathname)
      const newFolder = await this.upsertFolder(destinationPathname)
      const rewrittenNotes = await Promise.all(
        notes.map((note) =>
          this.updateNote(note._id, {
            folderPathname: destinationPathname,
          })
        )
      )
      // todo: [komediruzecki-14. 07. 2021.] See if we need to handle POUCH DB noteId set and other things
      //  or just remove completely and don't allow any actio in pouch DB storage
      updatedFolders.push({
        ...newFolder,
        pathname: destinationPathname,
        // noteIdSet: new Set(rewrittenNotes.map((note) => note._id)),
      })
      updatedNotes.push(...rewrittenNotes)
    }

    await this.removeFolder(pathname)

    return {
      folders: updatedFolders,
      notes: updatedNotes,
      removedFolders: allFoldersToRename,
    }
  }

  async doesParentFolderExistOrCreate(pathname: string) {
    const parentPathname = getParentFolderPathname(pathname)
    if (parentPathname !== '/') {
      await this.upsertFolder(parentPathname)
    }
  }

  async getAllDocsMap(): Promise<AllDocsMap> {
    const allDocsResponse = await this.pouchDb.allDocs({
      include_docs: true,
    })

    const map: AllDocsMap = {
      noteMap: {},
      folderMap: {},
      tagMap: {},
    }

    return allDocsResponse.rows.reduce((map, row) => {
      const { doc } = row
      if (isNoteDoc(doc)) {
        map.noteMap[doc._id] = doc
      } else if (isFolderDoc(doc)) {
        map.folderMap[getFolderPathname(doc._id)] = doc
      } else if (isTagDoc(doc)) {
        map.tagMap[getTagName(doc._id)] = doc
      }
      return map
    }, map)
  }

  async getTag(tagName: string): Promise<TagDoc | null> {
    const doc = this.getDoc(getTagId(tagName))
    return doc as any
  }

  async getDoc<T extends PouchDB.Core.GetMeta & PouchDB.Core.IdMeta>(
    docId: string
  ): Promise<T | null> {
    try {
      return await this.pouchDb.get<T>(docId)
    } catch (error) {
      switch (error.name) {
        case 'not_found':
          return null
        default:
          throw error
      }
    }
  }

  async upsertTag(tagName: string, props?: Partial<TagDocEditibleProps>) {
    if (!isTagNameValid(tagName)) {
      throw createUnprocessableEntityError(
        `tag name is invalid, got \`${tagName}\``
      )
    }

    const tag = await this.getTag(tagName)
    if (tag != null && props == null) {
      return tag
    }

    const now = getNow()
    const tagDocProps = {
      ...(tag || {
        _id: getTagId(tagName),
        createdAt: now,
        data: {},
      }),
      ...props,
      updatedAt: now,
    }
    const { rev } = await this.pouchDb.put(tagDocProps)

    return {
      _id: tagDocProps._id,
      createdAt: tagDocProps.createdAt,
      updatedAt: tagDocProps.updatedAt,
      data: tagDocProps.data,
      _rev: rev,
    }
  }

  async getNote(noteId: string): Promise<NoteDoc | null> {
    return this.getDoc<NoteDoc>(noteId)
  }

  async createNote(
    noteProps: Partial<NoteDocEditibleProps> = {}
  ): Promise<NoteDoc> {
    const now = getNow()
    const noteDocProps: ExceptRev<NoteDoc> = {
      _id: generateNoteId(),
      title: '',
      content: '',
      tags: [],
      folderPathname: '/',
      data: {},
      ...noteProps,
      createdAt: now,
      updatedAt: now,
      trashed: false,
    }

    await this.upsertFolder(noteDocProps.folderPathname)
    await Promise.all(
      noteDocProps.tags.map((tagName) => this.upsertTag(tagName))
    )

    const { rev } = await this.pouchDb.put(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async updateNote(noteId: string, noteProps: Partial<NoteDocEditibleProps>) {
    const note = await this.getNote(noteId)
    if (note == null)
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)

    if (noteProps.folderPathname) {
      await this.upsertFolder(noteProps.folderPathname)
    }
    if (noteProps.tags) {
      await Promise.all(
        noteProps.tags.map((tagName) => this.upsertTag(tagName))
      )
    }

    const now = getNow()
    const noteDocProps = {
      ...note,
      ...noteProps,
      updatedAt: now,
    }
    const { rev } = await this.pouchDb.put<NoteDoc>(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async findNotesByFolder(folderPathname: string): Promise<NoteDoc[]> {
    const { rows } = await this.pouchDb.query<NoteDoc>('notes/by_folder', {
      key: folderPathname,
      include_docs: true,
    })

    return rows.map((row) => row.doc!)
  }

  async findNotesByTag(tagName: string): Promise<NoteDoc[]> {
    const { rows } = await this.pouchDb.query<NoteDoc>('notes/by_tag', {
      key: tagName,
      include_docs: true,
    })

    return rows.map((row) => row.doc!)
  }

  async upsertNoteListViews() {
    const ddoc = await this.getDoc<
      {
        views: { [key: string]: { map: string } }
      } & PouchDB.Core.GetMeta &
        PouchDB.Core.IdMeta
    >('_design/notes')
    const byFolderMap = `function(doc) {
      if (doc._id.startsWith('note:')) {
        emit(doc.folderPathname);
      }
    }`
    const byTagMap = `function(doc) {
      if (doc._id.startsWith('note:')) {
        doc.tags.forEach(function(tag){
          emit(tag);
        });
      }
    }`
    if (ddoc != null) {
      if (
        ddoc.views.by_folder.map === byFolderMap &&
        ddoc.views.by_tag.map === byTagMap
      ) {
        return ddoc
      }
    }

    return this.pouchDb.put({
      ...(ddoc || {
        _id: '_design/notes',
      }),
      views: {
        by_folder: {
          map: byFolderMap,
        },
        by_tag: {
          map: byTagMap,
        },
      },
    })
  }

  async trashNote(noteId: string): Promise<NoteDoc> {
    const note = await this.getNote(noteId)
    if (note == null)
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)

    const now = getNow()
    const noteDocProps = {
      ...note,
      trashed: true,
      archivedAt: now,
    }
    const { rev } = await this.pouchDb.put<NoteDoc>(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async untrashNote(noteId: string): Promise<NoteDoc> {
    const note = await this.getNote(noteId)
    if (note == null)
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)

    await this.upsertFolder(note.folderPathname)

    await Promise.all(
      note.tags.map((tag) => {
        this.upsertTag(tag)
      })
    )

    const noteDocProps = {
      ...note,
      trashed: false,
      archivedAt: undefined,
    }
    const { rev } = await this.pouchDb.put<NoteDoc>(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async bookmarkNote(noteId: string): Promise<NoteDoc> {
    const note = await this.getNote(noteId)
    if (note == null) {
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)
    }

    if (note.data.bookmarked) {
      return note
    }

    const noteDocProps = {
      ...note,
      data: {
        ...note.data,
        bookmarked: true,
      },
    }

    const { rev } = await this.pouchDb.put<NoteDoc>(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async unbookmarkNote(noteId: string): Promise<NoteDoc> {
    const note = await this.getNote(noteId)
    if (note == null) {
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)
    }

    if (!note.data.bookmarked) {
      console.log('nochange ignore call')
      return note
    }

    const noteDocProps = {
      ...note,
      data: {
        ...note.data,
        bookmarked: false,
      },
    }

    const { rev } = await this.pouchDb.put<NoteDoc>(noteDocProps)

    return {
      ...noteDocProps,
      _rev: rev,
    }
  }

  async purgeNote(noteId: string): Promise<void> {
    const note = await this.getNote(noteId)
    if (note == null)
      throw createNotFoundError(`The note \`${noteId}\` does not exist`)

    await this.pouchDb.remove(note)
  }

  async updateTagByName(
    tagName: string,
    props?: Partial<TagDocEditibleProps>
  ): Promise<void> {
    await this.upsertTag(tagName, props)
  }

  async removeTag(tagName: string): Promise<void> {
    const notes = await this.findNotesByTag(tagName)
    await Promise.all(
      notes.map((note) => {
        return this.updateNote(note._id, {
          tags: note.tags.filter((tag) => tag !== tagName),
        })
      })
    )

    const tag = await this.getTag(tagName)
    if (tag != null) {
      await this.pouchDb.remove(tag as any)
    }
  }

  async renameTag(currentTagName: string, newTagName: string): Promise<void> {
    const currentTag = await this.getTag(currentTagName)
    if (currentTag == null) return

    const renamedTagProps = {
      data: currentTag.data,
      createdAt: currentTag.createdAt,
      updatedAt: getNow(),
    }

    await this.upsertTag(newTagName, renamedTagProps)

    const notes = await this.findNotesByTag(currentTagName)
    await Promise.all(
      notes.map((note) => {
        return this.updateNote(note._id, {
          tags: note.tags.flatMap((tag) =>
            tag === currentTagName ? [newTagName] : [tag]
          ),
        })
      })
    )

    await this.pouchDb.remove(currentTag as any)
  }

  async removeFolder(folderPathname: string): Promise<void> {
    const foldersToDelete = await this.getAllFolderUnderPathname(folderPathname)

    await Promise.all(
      foldersToDelete.map((folder) =>
        this.trashAllNotesInFolder(getFolderPathname(folder._id))
      )
    )

    await Promise.all(
      foldersToDelete.map((folder) => this.pouchDb.remove(folder as any))
    )
  }

  async getAllFolderUnderPathname(
    folderPathname: string
  ): Promise<FolderDoc[]> {
    const [folder, allDocs] = await Promise.all([
      this.getFolder(folderPathname),
      this.pouchDb.allDocs<FolderDoc>({
        startkey: `${getFolderId(folderPathname)}/`,
        endkey: `${getFolderId(folderPathname)}/\ufff0`,
        include_docs: true,
      }),
    ])
    // FIXME: https://github.com/microsoft/TypeScript/issues/35626
    const { rows } = allDocs as PouchDB.Core.AllDocsResponse<FolderDoc>
    const folderList: FolderDoc[] = rows.map((row) => row.doc!)
    if (folder != null) {
      folderList.unshift(folder)
    }

    return folderList
  }

  async trashAllNotesInFolder(folderPathname: string): Promise<void> {
    const notes = await this.findNotesByFolder(folderPathname)

    await Promise.all(
      notes
        .filter((note) => !note.trashed)
        .map((note) => this.trashNote(note._id))
    )
  }

  async getAllFolders(): Promise<FolderDoc[]> {
    const allDocsResponse = await this.pouchDb.allDocs<FolderDoc>({
      startkey: `${FOLDER_ID_PREFIX}/`,
      endkey: `${FOLDER_ID_PREFIX}/\ufff0`,
      include_docs: true,
    })
    return allDocsResponse.rows.map((row) => row.doc!)
  }

  async getFoldersByPathnames(pathnames: string[]): Promise<FolderDoc[]> {
    if (pathnames.length === 0) {
      return []
    }
    const allDocsResponse = await this.pouchDb.allDocs<FolderDoc>({
      keys: pathnames.map((pathname) => getFolderId(pathname)),
      include_docs: true,
    })
    return allDocsResponse.rows.map((row) => row.doc!)
  }

  async upsertAttachments(files: File[]): Promise<Attachment[]> {
    const { _rev } = await this.pouchDb.get(ATTACHMENTS_ID)
    let currentRev = _rev
    const attachments: Attachment[] = []
    let time = Date.now()
    for (const file of files) {
      const { name, ext } = parsePath(file.name)
      const fileName = `${dashify(name)}-${getHexatrigesimalString(
        time++
      )}${ext}`
      const response = await this.pouchDb.putAttachment(
        ATTACHMENTS_ID,
        fileName,
        currentRev,
        file,
        file.type
      )
      currentRev = response.rev
      attachments.push({
        name: fileName,
        type: file.type,
        getData: async () => {
          const blob = await this.pouchDb.getAttachment(
            ATTACHMENTS_ID,
            fileName
          )
          return {
            type: 'blob',
            blob: blob as Blob,
          }
        },
      })
    }

    return attachments
  }

  async removeAttachment(fileName: string): Promise<void> {
    const { _rev } = await this.pouchDb.get(ATTACHMENTS_ID)
    await this.pouchDb.removeAttachment(ATTACHMENTS_ID, fileName, _rev)
  }

  async getAttachmentMap(): Promise<ObjectMap<Attachment>> {
    let attachmentDoc
    try {
      attachmentDoc = await this.pouchDb.get(ATTACHMENTS_ID, {
        attachments: true,
        binary: true,
      })
    } catch (error) {
      if (error.name !== 'not_found') {
        throw error
      }
      await this.pouchDb.put({ _id: ATTACHMENTS_ID })
      attachmentDoc = await this.pouchDb.get(ATTACHMENTS_ID, {
        attachments: true,
      })
    }

    const { _attachments } = attachmentDoc
    if (_attachments == null) {
      return {}
    }
    return Object.entries(_attachments).reduce((map, [key, attachment]) => {
      map[key] = {
        name: key,
        type: attachment.content_type,

        getData: async () => {
          const blob = await this.pouchDb.getAttachment(ATTACHMENTS_ID, key)
          return {
            type: 'blob',
            blob: blob as Blob,
          }
        },
      }
      return map
    }, {} as ObjectMap<Attachment>)
  }
}
