import { PopulatedFolderDoc } from './db/types'
import _ from 'lodash'
import { generateId } from './string'

export interface FolderTreeMidData {
  pathname: string
  order: string
  children: Record<string, FolderTreeMidData>
}

export interface FolderTree {
  title: string
  pathname: string
  children: FolderTree[]
  expanded: boolean
}

export interface UpdateFolderTreeMidInfo {
  old: string
  new: string
  order: number
}

export interface UpdateFolderTreeInfo {
  oldPathname: string
  newPathname: string
  swapTargetPathname: string
  order: number
}

export function getFolderTreeData(
  folderArray: PopulatedFolderDoc[]
): FolderTree[] {
  folderArray.sort((a, b) => {
    return a.pathname.length - b.pathname.length
  })
  let result: Record<string, FolderTreeMidData> = {}
  folderArray.forEach((folder) => {
    if (folder.pathname !== '/') {
      const paths = folder.pathname.split('/')
      paths.splice(0, 1)
      result = setPathArrayRecursively(
        paths,
        result,
        folder.pathname,
        String(folder.order)
      )
    }
  })
  return transformArrayToMap(result)
}

function setPathArrayRecursively(
  input: string[],
  tempResult: Record<string, FolderTreeMidData>,
  pathname?: string,
  order?: string
): Record<string, FolderTreeMidData> {
  const key = input.shift()
  if (key == null) return {}
  if (!_.isEmpty(tempResult[key])) {
    tempResult[key].children = setPathArrayRecursively(
      input,
      tempResult[key].children,
      pathname,
      order
    )
  } else {
    if (_.isEmpty(input)) {
      tempResult[key] = {
        pathname: pathname || '',
        order: order || '',
        children: {},
      }
    } else {
      tempResult[key] = {
        pathname: order || '',
        order: pathname || '',
        children: setPathArrayRecursively(input, {}, pathname, order),
      }
    }
  }
  return tempResult
}

function transformArrayToMap(
  input: Record<string, FolderTreeMidData>
): FolderTree[] {
  const result: FolderTree[] = []
  Object.keys(input)
    .map((key) => {
      return { data: input[key], key: key }
    })
    .sort((a, b) => {
      const aOrder = a.data.order == undefined ? 0 : parseInt(a.data.order!)
      const bOrder = b.data.order == undefined ? 0 : parseInt(b.data.order!)
      if (aOrder === bOrder) {
        return a.data.pathname.localeCompare(b.data.pathname)
      } else {
        return aOrder - bOrder
      }
    })
    .forEach((val) => {
      if (Object.keys(val.data['children']).length > 0) {
        result.push({
          title: val.key,
          pathname: val.data['pathname'],
          children: transformArrayToMap(val.data['children']),
          expanded: true,
        })
      } else {
        result.push({
          title: val.key,
          pathname: val.data['pathname'],
          children: [],
          expanded: false,
        })
      }
    })
  return result
}

export function isDuplicateFolderPathname(treeData: FolderTree[]): boolean {
  const pathnames: UpdateFolderTreeMidInfo[] = []
  treeData.map((folder) => {
    organizeFolderTrees(false, folder, '/', pathnames)
  })
  const newPathnameEntries = pathnames.map((pathname) => pathname.new)
  return _.uniq(newPathnameEntries).length !== newPathnameEntries.length
}

function organizeFolderTrees(
  execUpdate: boolean,
  folder: FolderTree,
  pathname: string,
  pathnames: UpdateFolderTreeMidInfo[],
  order = 0
) {
  pathnames.push({
    old: folder.pathname,
    new: pathname + folder.title,
    order: order,
  })
  if (!_.isEmpty(folder.children)) {
    folder.children.forEach((child) => {
      organizeFolderTrees(
        execUpdate,
        child,
        pathname + folder.title + '/',
        pathnames,
        ++order
      )
    })
  }
  return ++order
}

export async function getUpdateFolderTreeInfo(
  folderTreeData: FolderTree[]
): Promise<UpdateFolderTreeInfo[]> {
  const pathnames: UpdateFolderTreeMidInfo[] = []
  let order = 0
  folderTreeData.map((folder) => {
    order = organizeFolderTrees(false, folder, '/', pathnames, ++order)
  })
  const pathnamesToReplace: UpdateFolderTreeInfo[] = []
  const swapTargetInfo: string[] = []
  pathnames
    .sort((a, b) => a.new.length - b.new.length)
    .forEach((pathname, idx) => {
      if (pathname.old !== pathname.new) {
        if (!_.isEmpty(swapTargetInfo[idx])) {
          pathnamesToReplace.push({
            oldPathname: swapTargetInfo[idx],
            newPathname: pathname.new,
            swapTargetPathname: '',
            order: pathname.order,
          })
        } else {
          let swapTargetIdx = -1
          for (let i = idx + 1; i < pathnames.length; i++) {
            if (pathname.new === pathnames[i].old) {
              swapTargetIdx = i
            }
          }
          if (swapTargetIdx < 0) {
            pathnamesToReplace.push({
              oldPathname: pathname.old,
              newPathname: pathname.new,
              swapTargetPathname: '',
              order: pathname.order,
            })
          } else {
            const swapTargetPathname = `/${generateId()}`
            pathnamesToReplace.push({
              oldPathname: pathname.old,
              newPathname: pathname.new,
              swapTargetPathname: swapTargetPathname,
              order: pathname.order,
            })
            swapTargetInfo[swapTargetIdx] = swapTargetPathname
          }
        }
      } else {
        pathnamesToReplace.push({
          oldPathname: pathname.old,
          newPathname: '',
          swapTargetPathname: '',
          order: pathname.order,
        })
      }
    })
  return pathnamesToReplace
}
