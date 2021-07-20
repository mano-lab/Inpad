import React, { useMemo, ChangeEventHandler, useCallback } from 'react'
import { NoteStorage, NoteDoc } from '../../lib/db/types'
import {
  values,
  isDirectSubPathname,
  getParentFolderPathname,
} from '../../lib/db/utils'
import PageContainer from '../atoms/PageContainer'
import FolderDetailListFolderItem from '../molecules/FolderDetailListFolderItem'
import FolderDetailListNoteItem from '../molecules/FolderDetailListNoteItem'
import { usePreferences } from '../../lib/preferences'
import NoteSortingOptionsFragment from '../molecules/NoteSortingOptionsFragment'
import { NoteSortingOptions } from '../../lib/sort'
import FolderDetailListItem from '../molecules/FolderDetailListItem'
import { useRouter } from '../../lib/router'
import {
  borderBottom,
  selectStyle,
} from '../../shared/lib/styled/styleFunctions'
import styled from '../../shared/lib/styled'
import { NOTE_ID_PREFIX } from '../../lib/db/consts'

interface FolderDetailProps {
  storage: NoteStorage
  folderPathname: string
}

const FolderDetail = ({ storage, folderPathname }: FolderDetailProps) => {
  const { preferences, setPreferences } = usePreferences()
  const noteSorting = preferences['general.noteSorting']
  const { push } = useRouter()

  const subFolders = useMemo(() => {
    const folders = values(storage.folderMap)
    return folders
      .filter((folder) => {
        return isDirectSubPathname(folderPathname, folder.pathname)
      })
      .sort((a, b) => {
        return a.pathname.localeCompare(b.pathname)
      })
  }, [storage.folderMap, folderPathname])

  const notes = useMemo(() => {
    const folder = storage.folderMap[folderPathname]
    if (folder == null) {
      return []
    }

    return [
      ...(folder.orderedIds || []).filter((orderId) =>
        orderId.startsWith(NOTE_ID_PREFIX)
      ),
    ]
      .reduce((notes, noteId) => {
        const note = storage.noteMap[noteId]
        if (note != null && !note.trashed) {
          notes.push(note)
        }
        return notes
      }, [] as NoteDoc[])
      .sort((a, b) => {
        switch (noteSorting) {
          case 'created-date-asc':
            return a.createdAt.localeCompare(b.createdAt)
          case 'created-date-dsc':
            return -a.createdAt.localeCompare(b.createdAt)
          case 'title-asc':
            if (a.title.trim() === '' && b.title.trim() !== '') {
              return 1
            }
            if (b.title.trim() === '' && a.title.trim() !== '') {
              return -1
            }
            return a.title.localeCompare(b.title)
          case 'title-dsc':
            if (a.title.trim() === '' && b.title.trim() !== '') {
              return 1
            }
            if (b.title.trim() === '' && a.title.trim() !== '') {
              return -1
            }
            return -a.title.localeCompare(b.title)
          case 'updated-date-asc':
            return a.updatedAt.localeCompare(b.updatedAt)
          case 'updated-date-dsc':
          default:
            return -a.updatedAt.localeCompare(b.updatedAt)
        }
      })
  }, [storage, folderPathname, noteSorting])

  const selectNoteSorting: ChangeEventHandler<HTMLSelectElement> = useCallback(
    (event) => {
      setPreferences({
        'general.noteSorting': event.target.value as NoteSortingOptions,
      })
    },
    [setPreferences]
  )

  const navigatorToParentFolder = useCallback(() => {
    if (folderPathname === '/') {
      return
    }

    push(
      `/app/storages/${storage.id}/notes${getParentFolderPathname(
        folderPathname
      )}`
    )
  }, [folderPathname, storage.id, push])

  const folderIsRoot = folderPathname === '/'

  return (
    <PageContainer>
      <Control>
        <div className='left' />
        <div className='right'>
          <select onChange={selectNoteSorting} value={noteSorting}>
            {<NoteSortingOptionsFragment />}
          </select>
        </div>
      </Control>
      <List>
        {!folderIsRoot && (
          <FolderDetailListItem label='..' onClick={navigatorToParentFolder} />
        )}
        {subFolders.map((folder) => {
          return (
            <FolderDetailListFolderItem
              key={folder._id}
              storageId={storage.id}
              folder={folder}
            />
          )
        })}
        {notes.map((note) => {
          return (
            <FolderDetailListNoteItem
              key={note._id}
              storageId={storage.id}
              note={note}
            />
          )
        })}
      </List>
    </PageContainer>
  )
}

export default FolderDetail

const Control = styled.div`
  display: flex;
  height: 40px;
  margin-top: 10px;
  ${borderBottom};
  .left {
    flex: 1;
  }
  .right {
    display: flex;
    align-items: center;

    select {
      ${selectStyle};
      width: 120px;
      height: 25px;
      margin-bottom: 10px;
      font-size: 14px;
    }
  }
`

const List = styled.ul`
  padding: 0;
  list-style: none;
  margin: 0;
`
