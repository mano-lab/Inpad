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
} from './utils'
import { FOLDER_ID_PREFIX, ATTACHMENTS_ID } from './consts'
import PouchDB from './PouchDB'
import { buildCloudSyncUrl, User } from '../accounts'
import { setHeader } from '../http'

export default class NoteDb {
  public initialized = false

  constructor(
    public pouchDb: PouchDB.Database,
    public id: string,
    public name: string
  ) {}

  async init() {
    await this.upsertNoteListViews()

    const { noteMap, folderMap, tagMap } = await this.getAllDocsMap()
    const { missingPathnameSet, missingTagNameSet, requiresUpdate } = values(
      noteMap
    ).reduce<{
      missingPathnameSet: Set<string>
      missingTagNameSet: Set<string>
      requiresUpdate: NoteDoc[]
    }>(
      (obj, noteDoc) => {
        if (noteDoc.trashed) {
          return obj
        }

        if (folderMap[noteDoc.folderPathname] == null) {
          obj.missingPathnameSet.add(noteDoc.folderPathname)
        }
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
        requiresUpdate: [],
      }
    )

    await this.upsertFolder('/')

    await Promise.all([
      ...[...missingPathnameSet].map((pathname) => this.upsertFolder(pathname)),
      ...[...missingTagNameSet].map((tagName) => this.upsertTag(tagName)),
      ...requiresUpdate.map((note) => this.updateNote(note._id, note)),
    ])
  }

  async getFolder(path: string): Promise<FolderDoc | null> {
    return this.getDoc<FolderDoc>(getFolderId(path))
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
    let order = (await this.getAllFolders()).length
    if (props != null && props.order != null) {
      order = props.order
    } else {
      if (folder != null && folder.order != null) {
        order = folder.order
      } else {
        const parentFolderPathname = getParentFolderPathname(pathname)
        if (parentFolderPathname !== '/') {
          const parentFolder = await this.getFolder(parentFolderPathname)
          if (parentFolder != null && parentFolder.order != null) {
            const foldersUnderPathname = await this.getAllFolderUnderPathname(
              parentFolderPathname
            )
            order = parentFolder.order + foldersUnderPathname.length
          }
        }
      }
    }

    const now = getNow()
    const folderDocProps = {
      ...(folder || {
        _id: getFolderId(pathname),
        createdAt: now,
        data: {},
        order: order,
      }),
      ...props,
      updatedAt: now,
    }
    const { rev } = await this.pouchDb.put(folderDocProps)

    return {
      _id: folderDocProps._id,
      createdAt: folderDocProps.createdAt,
      updatedAt: folderDocProps.updatedAt,
      data: folderDocProps.data,
      order: folderDocProps.order,
      _rev: rev,
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
    return this.getDoc<TagDoc>(getTagId(tagName))
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
      bookmarked: false,
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

    const noteDocProps = {
      ...note,
      trashed: true,
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
      this.pouchDb.remove(tag)
    }
  }

  async removeFolder(folderPathname: string, needDeleteSubFolders = true): Promise<void> {
    const foldersToDelete = needDeleteSubFolders
      ? await this.getAllFolderUnderPathname(folderPathname)
      : [await this.getFolder(folderPathname)]

    await Promise.all(
      foldersToDelete.map(async (folder) => {
        if (folder != null) {
          await this.trashAllNotesInFolder(getFolderPathname(folder._id))
        }
      })
    )

    await Promise.all(
      foldersToDelete.map(async (folder) => {
        if (folder != null) {
          await this.pouchDb.remove(folder)
        }
      })
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
    const folderList = rows.map((row) => row.doc!)
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
        .map(async (note) => await this.trashNote(note._id))
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

  sync(
    user: User,
    cloudStorage: { id: number }
  ): PouchDB.Replication.Sync<any> {
    const cloudPouch = new PouchDB(
      buildCloudSyncUrl(cloudStorage.id, user.id),
      {
        fetch: (url, opts = {}) => {
          if (opts.headers == null) {
            opts.headers = new Headers()
          }

          opts.headers = setHeader(
            'Authorization',
            `Bearer ${user.token}`,
            opts.headers
          )

          return PouchDB.fetch(url, opts)
        },
      }
    )
    return this.pouchDb.sync(cloudPouch, { live: false })
  }

  async upsertAttachments(files: File[]): Promise<Attachment[]> {
    const { _rev } = await this.pouchDb.get(ATTACHMENTS_ID)
    let currentRev = _rev
    const attachments: Attachment[] = []
    for (const file of files) {
      const { name, ext } = parsePath(file.name)
      const fileName = `${dashify(name)}${ext}`
      const response = await this.pouchDb.putAttachment(
        ATTACHMENTS_ID,
        fileName,
        currentRev,
        file,
        file.type
      )
      currentRev = response.rev
      const data = await this.pouchDb.getAttachment(ATTACHMENTS_ID, fileName)
      attachments.push({
        name: fileName,
        type: file.type,
        blob: data as Blob,
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
        binary: true,
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
        blob: (attachment as PouchDB.Core.FullAttachment).data as Blob,
      }
      return map
    }, {} as ObjectMap<Attachment>)
  }
}
