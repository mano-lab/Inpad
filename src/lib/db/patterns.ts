import { NavResource } from '../v2/interfaces/resources'
import { getFolderPathname, getParentFolderPathname } from './utils'
import { DraggedTo, SidebarDragState } from '../../shared/lib/dnd'

export function getResourceId(source: NavResource) {
  if (source.type == 'folder') {
    return source.result._realId
  } else {
    return source.result._id
  }
}

export function getResourceParentPathname(
  source: NavResource,
  targetedPosition?: SidebarDragState
) {
  if (source.type == 'doc') {
    return source.result.folderPathname
  } else {
    if (targetedPosition == DraggedTo.insideFolder) {
      return getFolderPathname(source.result._id)
    } else if (targetedPosition == DraggedTo.beforeItem) {
      return getParentFolderPathname(getFolderPathname(source.result._id))
    } else {
      return getParentFolderPathname(getFolderPathname(source.result._id))
    }
  }
}
