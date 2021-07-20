import PouchNoteDb from './PouchNoteDb'
import PouchDB from './PouchDB'
import {
  getFolderId,
  getTagId,
  generateNoteId,
  getNow,
  generateFolderId,
} from './utils'
import { sortNotesByKeys } from '../sort'
import { NoteDoc, FolderDoc, ExceptRev } from './types'

let noteDbCount = 0
async function prepareNoteDb(shouldInit = true): Promise<PouchNoteDb> {
  const id = `dummy${++noteDbCount}`
  const pouchDb = new PouchDB(id, {
    adapter: 'memory',
  })
  const noteDb = new PouchNoteDb(pouchDb, id, id)

  if (shouldInit) {
    await noteDb.init()
  }

  return noteDb
}

describe('PouchNoteDb', () => {
  describe('#getFolder', () => {
    it('returns a folder', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const now = new Date().toISOString()
      await noteDb.pouchDb.put<FolderDoc>({
        _id: getFolderId('/test'),
        _realId: generateFolderId(),
        createdAt: now,
        updatedAt: now,
        data: {},
      })

      // When
      const result = await noteDb.getFolder('/test')

      // Then
      expect(result).toEqual({
        _id: getFolderId('/test'),
        _rev: expect.any(String),
        createdAt: now,
        updatedAt: now,
        data: {},
      })
    })

    it('returns null if the folder does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.getFolder('/test')

      // Then
      expect(result).toEqual(null)
    })
  })

  describe('#upsertFolder', () => {
    it('creates a folder if it does not exist yet', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.upsertFolder('/test')

      // Then
      expect(result).toEqual({
        _id: getFolderId('/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: {},
      })

      const doc = await noteDb.pouchDb.get(getFolderId('/test'))
      expect(doc).toEqual({
        _id: getFolderId('/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: {},
      })
    })

    it('creates parent folder if it does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.upsertFolder('/parent/test')

      // Then
      expect(result).toEqual({
        _id: getFolderId('/parent/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: {},
      })

      const doc = await noteDb.pouchDb.get(getFolderId('/parent/test'))
      expect(doc).toEqual({
        _id: getFolderId('/parent/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: {},
      })

      const parentDoc = await noteDb.pouchDb.get(getFolderId('/parent'))
      expect(parentDoc).toEqual({
        _id: getFolderId('/parent'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: {},
      })
    })

    it('updates folder props', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.upsertFolder('/test')

      // When
      const result = await noteDb.upsertFolder('/test', {
        data: { message: 'yolo' },
      })

      // Then
      expect(result).toEqual({
        _id: getFolderId('/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: { message: 'yolo' },
      })

      const doc = await noteDb.pouchDb.get(getFolderId('/test'))
      expect(doc).toEqual({
        _id: getFolderId('/test'),
        _rev: expect.any(String),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        data: { message: 'yolo' },
      })
    })

    it('does NOT update folder props if nothing to change', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const { createdAt, updatedAt, _rev } = await noteDb.upsertFolder(
        '/test',
        { data: { message: 'yolo' } }
      )

      // When
      const result = await noteDb.upsertFolder('/test')

      // Then
      expect(result).toEqual({
        _id: getFolderId('/test'),
        _rev,
        createdAt,
        updatedAt,
        data: { message: 'yolo' },
      })

      const doc = await noteDb.pouchDb.get(getFolderId('/test'))
      expect(doc).toEqual({
        _id: getFolderId('/test'),
        _rev,
        createdAt,
        updatedAt,
        data: { message: 'yolo' },
      })
    })

    it('throws when pathname is invalid', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      // When
      try {
        await noteDb.upsertFolder('/invalid?pathname')
      } catch (error) {
        // Then
        expect(error.message).toBe(
          'pathname is invalid, got `/invalid?pathname`'
        )
      }
    })
  })

  describe('#getTag', () => {
    it('returns a tag', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const now = new Date().toISOString()
      await noteDb.pouchDb.put({
        _id: getTagId('test'),
        createdAt: now,
        updatedAt: now,
        data: {},
      })

      // When
      const result = await noteDb.getTag('test')

      // Then
      expect(result).toEqual({
        _id: getTagId('test'),
        _rev: expect.any(String),
        createdAt: now,
        updatedAt: now,
        data: {},
      })
    })

    it('returns null if the tag does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.getTag('test')

      // Then
      expect(result).toEqual(null)
    })
  })

  describe('#upsertTag', () => {
    it('creates a tag if it does not exist yet', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.upsertTag('test', {
        data: { message: 'yolo' },
      })

      // Then
      expect(result).toEqual({
        _id: getTagId('test'),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _rev: expect.any(String),
        data: {
          message: 'yolo',
        },
      })

      const doc = await noteDb.getTag('test')
      expect(doc).toEqual({
        _id: getTagId('test'),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _rev: expect.any(String),
        data: {
          message: 'yolo',
        },
      })
    })

    it('udpates tag props', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.upsertTag('test', {
        data: {},
      })

      // When
      const result = await noteDb.upsertTag('test', {
        data: { message: 'yolo' },
      })

      // Then
      expect(result).toEqual({
        _id: getTagId('test'),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _rev: expect.any(String),
        data: {
          message: 'yolo',
        },
      })

      const doc = await noteDb.getTag('test')
      expect(doc).toEqual({
        _id: getTagId('test'),
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        _rev: expect.any(String),
        data: {
          message: 'yolo',
        },
      })
    })

    it('does NOT update tag props if nothing to change', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const { createdAt, updatedAt, _rev } = await noteDb.upsertTag('test', {
        data: {
          message: 'yolo',
        },
      })

      // When
      const result = await noteDb.upsertTag('test')

      // Then
      expect(result).toEqual({
        _id: getTagId('test'),
        createdAt,
        updatedAt,
        _rev,
        data: {
          message: 'yolo',
        },
      })

      const doc = await noteDb.getTag('test')
      expect(doc).toEqual({
        _id: getTagId('test'),
        createdAt,
        updatedAt,
        _rev,
        data: {
          message: 'yolo',
        },
      })
    })

    it('throws when tag name is invalid', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      // When
      try {
        await noteDb.upsertTag('invalid tag')
      } catch (error) {
        // Then
        expect(error.message).toBe('tag name is invalid, got `invalid tag`')
      }
    })
  })

  describe('#getNote', () => {
    it('returns a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const noteId = generateNoteId()
      const now = new Date().toISOString()
      await noteDb.pouchDb.put({
        _id: noteId,
        folderPathname: '/',
        tags: [],
        createdAt: now,
        updatedAt: now,
        movedToTrash: false,
        title: 'test title',
        content: 'test content',
        data: {},
      })

      // When
      const result = await noteDb.getNote(noteId)

      // Then
      expect(result).toEqual({
        _id: noteId,
        _rev: expect.any(String),
        folderPathname: '/',
        tags: [],
        createdAt: now,
        updatedAt: now,
        movedToTrash: false,
        title: 'test title',
        content: 'test content',
        data: {},
      })
    })

    it('returns null if the note does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.getNote('test')

      // Then
      expect(result).toEqual(null)
    })
  })

  describe('#createNote', () => {
    it('creates a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
      })

      // Then
      expect(result).toEqual({
        _id: expect.any(String),
        title: 'test title',
        content: 'test content',
        tags: [],
        folderPathname: '/',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })

      const doc = await noteDb.getNote(result._id)
      expect(doc).toEqual({
        _id: expect.any(String),
        title: 'test title',
        content: 'test content',
        tags: [],
        folderPathname: '/',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })
    })

    it('creates missing tags and folder', async () => {
      // Given
      const noteDb = await prepareNoteDb()

      // When
      const result = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
        tags: ['test'],
        folderPathname: '/test',
      })

      // Then
      expect(result).toEqual({
        _id: expect.any(String),
        title: 'test title',
        content: 'test content',
        tags: ['test'],
        folderPathname: '/test',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })

      const folder = await noteDb.getFolder('/test')
      expect(folder).not.toBe(null)

      const tag = await noteDb.getTag('test')
      expect(tag).not.toBe(null)
    })
  })

  describe('#updateNote', () => {
    it('updates a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const { _id } = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
      })

      // When
      const result = await noteDb.updateNote(_id, {
        title: 'changed title',
        content: 'changed content',
      })

      // Then
      expect(result).toEqual({
        _id: expect.any(String),
        title: 'changed title',
        content: 'changed content',
        tags: [],
        folderPathname: '/',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })

      const doc = await noteDb.getNote(_id)
      expect(doc).toEqual({
        _id: expect.any(String),
        title: 'changed title',
        content: 'changed content',
        tags: [],
        folderPathname: '/',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })
    })

    it('creates missing tags and missing folder', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const { _id } = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
        tags: ['old'],
      })

      // When
      const result = await noteDb.updateNote(_id, {
        title: 'changed title',
        content: 'changed content',
        folderPathname: '/new folder',
        tags: ['new'],
      })

      // Then
      expect(result).toEqual({
        _id: expect.any(String),
        title: 'changed title',
        content: 'changed content',
        tags: ['new'],
        folderPathname: '/new folder',
        data: {},
        createdAt: expect.any(String),
        updatedAt: expect.any(String),
        trashed: false,
        _rev: expect.any(String),
      })

      const tag = await noteDb.getTag('new')
      expect(tag).not.toBe(null)

      const folder = await noteDb.getFolder('/new folder')
      expect(folder).not.toBe(null)
    })

    it('throws when the note does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      // When
      try {
        await noteDb.updateNote('note:missing', {
          title: 'changed title',
          content: 'changed content',
        })
      } catch (error) {
        // Then
        expect(error.message).toBe('The note `note:missing` does not exist')
      }
    })
  })

  describe('findNotesByFolder', () => {
    it('returns notes in folders', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.init()
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/test',
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/test',
      })
      await noteDb.createNote({
        title: 'test title3',
        content: 'test content3',
        folderPathname: '/another folder',
      })

      // When
      const result = await noteDb.findNotesByFolder('/test')

      expect(sortNotesByKeys(result, 'title')).toEqual([
        {
          _id: note1._id,
          _rev: note1._rev,
          title: 'test title1',
          content: 'test content1',
          folderPathname: '/test',
          tags: [],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
        {
          _id: note2._id,
          _rev: note2._rev,
          title: 'test title2',
          content: 'test content2',
          folderPathname: '/test',
          tags: [],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
      ])
    })
  })

  describe('findNotesByTag', () => {
    it('returns notes in folders', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.init()
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/',
        tags: ['tag1'],
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/',
        tags: ['tag1', 'tag2'],
      })
      const note3 = await noteDb.createNote({
        title: 'test title3',
        content: 'test content3',
        folderPathname: '/',
        tags: ['tag2'],
      })

      // When
      const result1 = await noteDb.findNotesByTag('tag1')

      // Then
      expect(sortNotesByKeys(result1, 'title')).toEqual([
        {
          _id: note1._id,
          _rev: note1._rev,
          title: 'test title1',
          content: 'test content1',
          folderPathname: '/',
          tags: ['tag1'],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
        {
          _id: note2._id,
          _rev: note2._rev,
          title: 'test title2',
          content: 'test content2',
          folderPathname: '/',
          tags: ['tag1', 'tag2'],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
      ])

      // When
      const result2 = await noteDb.findNotesByTag('tag2')

      // Then
      expect(sortNotesByKeys(result2, 'title')).toEqual([
        {
          _id: note2._id,
          _rev: note2._rev,
          title: 'test title2',
          content: 'test content2',
          folderPathname: '/',
          tags: ['tag1', 'tag2'],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
        {
          _id: note3._id,
          _rev: note3._rev,
          title: 'test title3',
          content: 'test content3',
          folderPathname: '/',
          tags: ['tag2'],
          data: {},
          createdAt: expect.any(String),
          updatedAt: expect.any(String),
          trashed: false,
        },
      ])
    })
  })

  describe('trashNote', () => {
    it('trashes a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const note = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
      })

      // When
      const result = await noteDb.trashNote(note._id)

      // Then
      expect(result).toMatchObject({
        _id: note._id,
        trashed: true,
      })

      const doc = await noteDb.pouchDb.get(note._id)
      expect(doc).toMatchObject({
        _id: note._id,
        trashed: true,
      })
    })

    it('throws when the note does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      try {
        // When
        await noteDb.trashNote('note:missing')
      } catch (error) {
        // Then
        expect(error.message).toBe('The note `note:missing` does not exist')
      }
    })
  })

  describe('untrashNote', () => {
    it('untrashes a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const note = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
      })

      // When
      const result = await noteDb.untrashNote(note._id)

      // Then
      expect(result).toMatchObject({
        _id: note._id,
        trashed: false,
      })

      const doc = await noteDb.pouchDb.get(note._id)
      expect(doc).toMatchObject({
        _id: note._id,
        trashed: false,
      })
    })

    it('restores missing folder of the note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const noteId = generateNoteId()
      const now = getNow()
      await noteDb.pouchDb.put<ExceptRev<NoteDoc>>({
        _id: noteId,
        folderPathname: '/missing folder',
        tags: [],
        createdAt: now,
        updatedAt: now,
        trashed: true,
        title: 'test title',
        content: 'test content',
        data: {},
      })

      // When
      const result = await noteDb.untrashNote(noteId)

      // Then
      expect(result).toMatchObject({
        _id: noteId,
        trashed: false,
      })

      const doc = await noteDb.pouchDb.get(noteId)
      expect(doc).toMatchObject({
        _id: noteId,
        trashed: false,
      })

      const folderDoc = await noteDb.getFolder('/missing folder')
      expect(folderDoc).not.toBe(null)
    })

    it('throws when the note does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      try {
        // When
        await noteDb.untrashNote('note:missing')
      } catch (error) {
        // Then
        expect(error.message).toBe('The note `note:missing` does not exist')
      }
    })
  })

  describe('purgeNote', () => {
    it('delete a note', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      const note = await noteDb.createNote({
        title: 'test title',
        content: 'test content',
      })

      // When
      await noteDb.purgeNote(note._id)

      // Then
      const doc = await noteDb.getNote(note._id)
      expect(doc).toBe(null)
    })

    it('throws when the note does not exist', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      expect.assertions(1)

      try {
        // When
        await noteDb.purgeNote('note:missing')
      } catch (error) {
        // Then
        expect(error.message).toBe('The note `note:missing` does not exist')
      }
    })
  })

  describe('removeTag', () => {
    it('removes tag and updates notes with the tag', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.init()
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/',
        tags: ['tag1'],
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/',
        tags: ['tag1', 'tag2'],
      })

      // When
      await noteDb.removeTag('tag1')

      // Then
      const storedNote1 = await noteDb.getNote(note1._id)
      expect(storedNote1).toMatchObject({
        tags: [],
      })

      const storedNote2 = await noteDb.getNote(note2._id)
      expect(storedNote2).toMatchObject({
        tags: ['tag2'],
      })
    })
  })

  describe('renameTag', () => {
    it('removes previous tag name and updates notes with the tag name', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.init()
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/',
        tags: ['tag1'],
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/',
        tags: ['tag1', 'tag2'],
      })

      // When
      await noteDb.renameTag('tag1', 'tag3')

      // Then
      const storedNote1 = await noteDb.getNote(note1._id)
      expect(storedNote1).toMatchObject({
        tags: ['tag3'],
      })

      const storedNote2 = await noteDb.getNote(note2._id)
      expect(storedNote2).toMatchObject({
        tags: ['tag3', 'tag2'],
      })
    })
  })

  describe('removeFolder', () => {
    it('removes a folder and its notes', async () => {
      // Given
      const noteDb = await prepareNoteDb()
      await noteDb.init()
      const note = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/test',
      })

      // When
      await noteDb.removeFolder('/test')

      // Then
      const storedFolder = await noteDb.getFolder('/test')
      expect(storedFolder).toBe(null)

      const storedNote = await noteDb.getNote(note._id)
      expect(storedNote).toMatchObject({
        trashed: true,
      })
    })

    it('removes child folders and their notes too', async () => {
      // Given
      const noteDb = await prepareNoteDb(true)
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/test',
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/test/child folder',
      })

      // When
      await noteDb.removeFolder('/test')

      // Then
      const storedFolder = await noteDb.getFolder('/test')
      expect(storedFolder).toBe(null)

      const storedChildFolder = await noteDb.getFolder('/test/child folder')
      expect(storedChildFolder).toBe(null)

      const storedNote1 = await noteDb.getNote(note1._id)
      expect(storedNote1).toMatchObject({
        trashed: true,
      })

      const storedNote2 = await noteDb.getNote(note2._id)
      expect(storedNote2).toMatchObject({
        trashed: true,
      })
    })
  })

  describe('getAllFolderUnderPathname', () => {
    it('returns list of a folder and its child folders', async () => {
      // Given
      const noteDb = await prepareNoteDb(true)
      await noteDb.upsertFolder('/test/child folder')
      await noteDb.upsertFolder('/test2')

      // When
      const result = await noteDb.getAllFolderUnderPathname('/test')

      // Then
      expect(result).toEqual([
        expect.objectContaining({
          _id: getFolderId('/test'),
        }),
        expect.objectContaining({
          _id: getFolderId('/test/child folder'),
        }),
      ])
    })
  })

  describe('trashAllNotesInFolder', () => {
    it('trashes all notes in the folder', async () => {
      // Given
      const noteDb = await prepareNoteDb(true)
      const note1 = await noteDb.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/test',
      })
      const note2 = await noteDb.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/test',
      })
      const note3 = await noteDb.createNote({
        title: 'test title3',
        content: 'test content3',
        folderPathname: '/test2',
      })

      // When
      await noteDb.trashAllNotesInFolder('/test')

      // Then
      const storedNote1 = await noteDb.getNote(note1._id)
      expect(storedNote1).toMatchObject({
        trashed: true,
      })
      const storedNote2 = await noteDb.getNote(note2._id)
      expect(storedNote2).toMatchObject({
        trashed: true,
      })

      const storedNote3 = await noteDb.getNote(note3._id)
      expect(storedNote3).toMatchObject({
        trashed: false,
      })
    })
  })

  describe('getAllDocsMap', () => {
    it('returns all docs map', async () => {
      // Given
      const client = await prepareNoteDb()
      const note1 = await client.createNote({
        title: 'test title1',
        content: 'test content1',
        folderPathname: '/test/child folder',
        tags: ['tag1', 'tag2'],
      })
      const note2 = await client.createNote({
        title: 'test title2',
        content: 'test content2',
        folderPathname: '/test/child folder2',
        tags: ['tag2', 'tag3'],
      })

      // When
      const result = await client.getAllDocsMap()

      // Then
      expect(result.noteMap).toEqual({
        [note1._id]: note1,
        [note2._id]: note2,
      })

      expect(result.folderMap).toEqual({
        '/': expect.anything(),
        '/test': expect.anything(),
        '/test/child folder': expect.anything(),
        '/test/child folder2': expect.anything(),
      })

      expect(result.tagMap).toEqual({
        tag1: expect.anything(),
        tag2: expect.anything(),
        tag3: expect.anything(),
      })
    })

    describe('init', () => {
      it('restore missing folders and tags', async () => {
        // Given
        const client = await prepareNoteDb()
        await client.createNote({
          title: 'test title1',
          content: 'test content1',
          folderPathname: '/test/child folder',
          tags: ['tag1', 'tag2'],
        })
        await client.createNote({
          title: 'test title2',
          content: 'test content2',
          folderPathname: '/test/child folder2',
          tags: ['tag2', 'tag3'],
        })
        await client.pouchDb.remove(
          ((await client.getFolder('/test/child folder')) as any)!
        )
        await client.pouchDb.remove((await client.getTag('tag1')) as any)
        expect(await client.getFolder('/test/child folder')).toBe(null)
        expect(await client.getTag('tag1')).toBe(null)

        // When
        await client.init()

        // Then
        expect(await client.getFolder('/test/child folder')).not.toBe(null)
        expect(await client.getTag('tag1')).not.toBe(null)
      })
    })
  })
})
