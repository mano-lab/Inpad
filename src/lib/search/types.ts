import { HistoryItem } from './search'
import { FolderDoc, NoteDoc } from '../db/types'

export interface SearchContext {
  history: HistoryItem[]
  searchHistory: string[]
  addToSearchHistory: (val: string) => void
  addVisitedToHistory: (item: NoteDoc | FolderDoc) => void
}
