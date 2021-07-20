import { createDbStoreCreator, getStorageDataList } from './createStore'
import { MemoryLiteStorage } from 'ltstrg'
import { renderHook, act } from '@testing-library/react-hooks'
import { NoteStorage, NoteDoc } from './types'
import { getFolderId } from './utils'
import { RouterProvider, useRouter } from '../router'
import { usePathnameWithoutNoteId } from '../routeParams'
import { combineProviders } from '../context'
import { ToastProvider } from '../toast'
import { PreferencesProvider } from '../preferences'
import '../i18n'

function prepareDbStore() {
  const memoryStorage = new MemoryLiteStorage()
  const { result } = renderHook(
    () =>
      createDbStoreCreator(
        memoryStorage,
        useRouter,
        usePathnameWithoutNoteId
      )(),
    {
      wrapper: combineProviders(
        PreferencesProvider,
        RouterProvider,
        ToastProvider
      ),
    }
  )

  return {
    result,
    memoryStorage,
  }
}

describe('DbStore', () => {
  describe('#createStorage', () => {
    it('creates a storage', async () => {
      // Given
      const { result, memoryStorage } = prepareDbStore()

      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()

        // When
        storage = await result.current.createStorage('test')
      })

      // Then
      expect(result.current.storageMap).toEqual({
        [storage!.id]: expect.objectContaining({
          name: 'test',
        }),
      })

      expect(getStorageDataList(memoryStorage)).toEqual([
        {
          id: storage!.id,
          name: 'test',
        },
      ])
    })
  })

  describe('#removeStorage', () => {
    it('remove a storage', async () => {
      // Given
      const { result, memoryStorage } = prepareDbStore()

      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')

        // When
        await result.current.removeStorage(storage.id)
      })

      // Then
      expect(result.current.storageMap).toEqual({})

      expect(getStorageDataList(memoryStorage)).toEqual([])
    })
  })

  describe('#renameStorage', () => {
    it('renames a storage', async () => {
      // Given
      const { result, memoryStorage } = prepareDbStore()

      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')

        // When
        await result.current.renameStorage(storage.id, 'changed')
      })

      // Then
      expect(result.current.storageMap).toEqual({
        [storage!.id]: expect.objectContaining({
          name: 'changed',
        }),
      })

      expect(getStorageDataList(memoryStorage)).toEqual([
        {
          id: storage!.id,
          name: 'changed',
        },
      ])
    })
  })

  describe('#createFolder', () => {
    it('creates a folder', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')

        // When
        await result.current.createFolder(storage.id, '/test')
      })

      // Then
      expect(result.current.storageMap[storage!.id]!.folderMap).toEqual({
        '/': expect.objectContaining({ pathname: '/' }),
        '/test': expect.objectContaining({ pathname: '/test' }),
      })

      const folderDoc = await storage!.db.getFolder('/test')
      expect(folderDoc).toMatchObject({
        _id: getFolderId('/test'),
      })
    })

    it('refreshes folderMap to reflect(collateral parent folder creation)', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')

        // When
        await result.current.createFolder(storage.id, '/test/child folder')
      })

      // Then
      expect(result.current.storageMap[storage!.id]!.folderMap).toEqual({
        '/': expect.objectContaining({ pathname: '/' }),
        '/test': expect.objectContaining({ pathname: '/test' }),
        '/test/child folder': expect.objectContaining({
          pathname: '/test/child folder',
        }),
      })

      const folderDoc = await storage!.db.getFolder('/test')
      expect(folderDoc).toMatchObject({
        _id: getFolderId('/test'),
      })

      const chioldFolderDoc = await storage!.db.getFolder('/test/child folder')
      expect(chioldFolderDoc).toMatchObject({
        _id: getFolderId('/test/child folder'),
      })
    })
  })

  describe('#removeFolder', () => {
    it('removes a folder', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(result.current.storageMap[storage!.id]!.folderMap).toEqual({
        '/': expect.objectContaining({ pathname: '/' }),
      })
    })

    it('removes its sub folders', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test/child folder')

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(result.current.storageMap[storage!.id]!.folderMap).toEqual({
        '/': expect.objectContaining({ pathname: '/' }),
      })
    })

    it('trashes child notes of target folder', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        note = await result.current.createNote(storage.id, {
          folderPathname: '/test',
        })

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.noteMap[note!._id]!.trashed
      ).toEqual(true)
    })

    it('trashes child notes of sub folders', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test/childfolder')
        note = await result.current.createNote(storage.id, {
          folderPathname: '/test/childfolder',
        })

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.noteMap[note!._id]!.trashed
      ).toEqual(true)
    })

    it('updates tag map from child notes of target folder', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        await result.current.createNote(storage.id, {
          folderPathname: '/test',
          tags: ['tagTest'],
        })

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.tagMap['tagTest']!.noteIdSet
          .size
      ).toEqual(0)
    })

    it('updates tag map from child notes of sub folders', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test/childfolder')
        await result.current.createNote(storage.id, {
          folderPathname: '/test/childfolder',
          tags: ['tagTest'],
        })

        // When
        await result.current.removeFolder(storage.id, '/test')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.tagMap['tagTest']!.noteIdSet
          .size
      ).toEqual(0)
    })
  })

  describe('#createNote', () => {
    it('creates a note and registers in the map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')

        // When
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
        })
      })

      // Then
      expect(result.current.storageMap[storage!.id]!.noteMap).toEqual({
        [noteDoc!._id]: expect.objectContaining({ title: 'testNote' }),
      })
    })

    it('creates a note and register its tag', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')

        // When
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['testTag'],
        })
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.tagMap[noteDoc!.tags[0]]!
          .noteIdSet
      ).toMatchObject(new Set([noteDoc!._id]))
    })
  })

  describe('#updateNote', () => {
    it('update a Note and handle tag removal', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['tag1', 'tag2'],
        })

        // When
        noteDoc = await result.current.updateNote(storage.id, noteDoc!._id, {
          tags: ['tag2'],
        })
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.tagMap['tag1']!.noteIdSet.size
      ).toEqual(0)
    })

    it('update a Note and handle tag addition', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['tag1'],
        })
        await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['tag2'],
        })

        // When
        noteDoc = await result.current.updateNote(storage.id, noteDoc!._id, {
          tags: ['tag1', 'tag2'],
        })
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.tagMap['tag2']!.noteIdSet.size
      ).toEqual(2)
    })
  })

  describe('#purgeNote', () => {
    it('removes note from note map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
        })

        // When
        await result.current.purgeNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.noteMap[noteDoc!._id]
        ).toBeUndefined()
      })
    })

    it('removes note from folder map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          folderPathname: '/test',
        })

        // When
        await result.current.purgeNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.folderMap[
            noteDoc!.folderPathname
          ]!.orderedIds!.indexOf(noteDoc!._id) == -1
        ).toEqual(false)
      })
    })

    it('removes note tags from tag map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['testTag'],
        })

        // When
        await result.current.purgeNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.tagMap[
            'testTag'
          ]!.noteIdSet.has(noteDoc!._id)
        ).toEqual(false)
      })
    })
  })

  describe('#trashNote', () => {
    it('change trashed prop of note in note map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
        })

        // When
        await result.current.trashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.noteMap[noteDoc!._id]!.trashed
        ).toEqual(true)
      })
    })

    it('removes note from folder map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          folderPathname: '/test',
        })

        // When
        await result.current.trashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.folderMap[
            noteDoc!.folderPathname
          ]!.orderedIds!.indexOf(noteDoc!._id)
        ).toEqual(-1)
      })
    })

    it('removes note tags from tag map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['testTag'],
        })

        // When
        await result.current.trashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.tagMap[
            'testTag'
          ]!.noteIdSet.has(noteDoc!._id)
        ).toEqual(false)
      })
    })
  })

  describe('#untrashNote', () => {
    it('adds note back to folder map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          folderPathname: '/test',
        })
        await result.current.trashNote(storage.id, noteDoc!._id)

        // When
        await result.current.untrashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.folderMap[
            noteDoc!.folderPathname
          ]!.orderedIds!.indexOf(noteDoc!._id) != -1
        ).toEqual(true)
      })
    })

    it('adds back linked folder if it was removed', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          folderPathname: '/test',
        })
        await result.current.removeFolder(storage.id, noteDoc!.folderPathname)

        // When
        await result.current.untrashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.folderMap[
            noteDoc!.folderPathname
          ]
        ).toBeDefined()
      })
    })

    it('adds note back to tags map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let noteDoc: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        noteDoc = await result.current.createNote(storage.id, {
          folderPathname: '/test',
          tags: ['testTag'],
        })
        await result.current.trashNote(storage.id, noteDoc!._id)

        // When
        await result.current.untrashNote(storage.id, noteDoc!._id)

        // Then
        expect(
          result.current.storageMap[storage!.id]!.tagMap[
            'testTag'
          ]!.noteIdSet.has(noteDoc!._id)
        ).toEqual(true)
      })
    })
  })

  describe('#removeTag', () => {
    it('removes tag from tag map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        await result.current.createNote(storage.id, {
          tags: ['tagTest'],
        })

        // When
        await result.current.removeTag(storage.id, 'tagTest')

        // Then
        expect(
          result.current.storageMap[storage!.id]!.tagMap['tagTest']
        ).toBeUndefined()
      })
    })

    it('removes tag from tagged notes', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        note = await result.current.createNote(storage.id, {
          tags: ['tagTest'],
        })

        // When
        await result.current.removeTag(storage.id, 'tagTest')

        // Then
        expect(
          result.current.storageMap[storage!.id]!.noteMap[
            note!._id
          ]!.tags.includes('tagTest')
        ).toEqual(false)
      })
    })
  })

  describe('#renameTag', () => {
    it('removes previous tag from tag map', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        await result.current.createNote(storage.id, {
          tags: ['tagTest'],
        })

        // When
        await result.current.renameTag(storage.id, 'tagTest', 'tagTestRenamed')

        // Then
        expect(
          result.current.storageMap[storage!.id]!.tagMap['tagTest']
        ).toBeUndefined()
      })
    })

    it('removes previous tag from tagged notes', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        note = await result.current.createNote(storage.id, {
          tags: ['tagTest'],
        })

        // When
        await result.current.renameTag(storage.id, 'tagTest', 'tagTestRenamed')

        // Then
        expect(
          result.current.storageMap[storage!.id]!.noteMap[
            note!._id
          ]!.tags.includes('tagTest')
        ).toEqual(false)
      })
    })

    it('adds new tag to previously tagged notes', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc | undefined
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')
        note = await result.current.createNote(storage.id, {
          title: 'testNote',
          tags: ['tagTest'],
        })

        // When
        await result.current.renameTag(storage.id, 'tagTest', 'tagTestRenamed')

        // Then
        expect(
          result.current.storageMap[storage!.id]!.noteMap[
            note!._id
          ]!.tags.includes('tagTestRenamed')
        ).toEqual(true)
      })
    })
  })

  describe('#renameFolder', () => {
    it('removes a folder previous path', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.folderMap['/test']
      ).toBeUndefined()

      const folderDoc = await storage!.db.getFolder('/test')
      expect(folderDoc).toBeNull()
    })

    it('creates a folder with the new path', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test')

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      const folderDoc = await storage!.db.getFolder('/testok')
      expect(folderDoc).toMatchObject({
        _id: getFolderId('/testok'),
      })

      expect(
        result.current.storageMap[storage!.id]!.folderMap['/testok']
      ).toBeDefined()
    })

    it('removes subfolders with the previous path', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test/subtest')

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.folderMap['/test/subtest']
      ).toBeUndefined()

      const folderDoc = await storage!.db.getFolder('/test/subtest')
      expect(folderDoc).toBeNull()
    })

    it('creates subfolders with the new path', async () => {
      // Given
      const { result } = prepareDbStore()
      let storage: NoteStorage
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        await result.current.createFolder(storage.id, '/test/subtest')

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      const folderDoc = await storage!.db.getFolder('/testok/subtest')
      expect(folderDoc).toMatchObject({
        _id: getFolderId('/testok/subtest'),
      })

      expect(
        result.current.storageMap[storage!.id]!.folderMap['/testok/subtest']
      ).toBeDefined()
    })

    it("changes the notes' folderpathname", async () => {
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        note = (await result.current.createNote(storage.id, {
          folderPathname: '/test',
        })) as NoteDoc

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.noteMap[note!._id]
      ).toMatchObject({
        folderPathname: '/testok',
      })
    })

    it("changes the subfolders' notes' folderpathnames", async () => {
      const { result } = prepareDbStore()
      let storage: NoteStorage
      let note: NoteDoc
      await act(async () => {
        await result.current.initialize()
        storage = await result.current.createStorage('test')
        note = (await result.current.createNote(storage.id, {
          folderPathname: '/test/subfolder',
        })) as NoteDoc

        // When
        await result.current.renameFolder(storage.id, '/test', '/testok')
      })

      // Then
      expect(
        result.current.storageMap[storage!.id]!.noteMap[note!._id]
      ).toMatchObject({
        folderPathname: '/testok/subfolder',
      })
    })
  })
})
