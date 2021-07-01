import { SidebarSearchHistory } from '../../../../shared/components/organisms/Sidebar/molecules/SidebarSearch'
import { mdiFileDocumentOutline, mdiFolderOutline } from '@mdi/js'
import { FolderDoc, NoteDoc, NoteStorage, ObjectMap } from '../../../db/types'
import {
  getFolderHref,
  getFolderName,
  getDocHref,
  getNoteTitle,
  getFolderPathname,
} from '../../../db/utils'
import { HistoryItem } from '../../../search/search'

export function mapHistory(
  history: HistoryItem[],
  push: (href: string) => void,
  noteMap: ObjectMap<NoteDoc>,
  foldersMap: ObjectMap<FolderDoc>,
  workspace: NoteStorage
) {
  if (!history) {
    return []
  }
  const items = [] as SidebarSearchHistory[]
  history.forEach((historyItem) => {
    if (historyItem.type === 'folder') {
      const folderDoc = foldersMap[getFolderPathname(historyItem.item)]
      if (folderDoc != null) {
        const href = getFolderHref(folderDoc, workspace.id)
        items.push({
          // emoji: folderDoc.emoji,
          defaultIcon: mdiFolderOutline,
          label: getFolderName(folderDoc),
          href,
          onClick: () => push(href),
        })
      }
    } else {
      const noteDoc = noteMap[historyItem.item]
      if (noteDoc != null) {
        const href = getDocHref(noteDoc, workspace.id)
        items.push({
          // emoji: noteDoc.emoji,
          defaultIcon: mdiFileDocumentOutline,
          label: getNoteTitle(noteDoc, 'Untitled'),
          href,
          onClick: () => push(href),
        })
      }
    }
  })

  return items
}
