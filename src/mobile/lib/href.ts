import { SerializedDoc } from '../../cloud/interfaces/db/doc'
import { SerializedTeam } from '../../cloud/interfaces/db/team'
import { DocLinkIntent } from '../../cloud/components/atoms/Link/DocLink'
import querystring from 'querystring'
import {
  getDocURL,
  getTeamURL,
  getFolderURL,
  getWorkspaceURL,
} from '../../cloud/lib/utils/patterns'
import {
  TeamIdProps,
  TeamLinkIntent,
} from '../../cloud/components/atoms/Link/TeamLink'
import { SerializedSmartFolder } from '../../cloud/interfaces/db/smartFolder'
import { SerializedFolder } from '../../cloud/interfaces/db/folder'
import { SerializedTag } from '../../cloud/interfaces/db/tag'
import { SerializedWorkspace } from '../../cloud/interfaces/db/workspace'

export function getTeamLinkHref(
  team: TeamIdProps,
  intent: TeamLinkIntent,
  query?: any
) {
  const basePathname = `/${team.domain != null ? team.domain : team.id}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}

export function getDocLinkHref(
  doc: SerializedDoc,
  team: SerializedTeam,
  intent: DocLinkIntent,
  query?: any
) {
  const basePathname = `${getTeamURL(team)}${getDocURL(doc)}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}

export type FolderLinkIntent = 'index'

export function getFolderHref(
  folder: SerializedFolder,
  team: SerializedTeam,
  intent: FolderLinkIntent,
  query?: any
) {
  const basePathname = `${getTeamURL(team)}${getFolderURL(folder)}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}

export type SmartFolderRouteIntent = 'index'

export function getSmartFolderHref(
  smartFolder: SerializedSmartFolder,
  team: SerializedTeam,
  intent: SmartFolderRouteIntent,
  query?: any
) {
  const basePathname = `${getTeamURL(team)}/smart-folders/${encodeURIComponent(
    smartFolder.id
  )}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}

export type DocStatusRouteIntent =
  | 'in-progress'
  | 'paused'
  | 'completed'
  | 'archived'

export function getDocStatusHref(
  team: SerializedTeam,
  intent: DocStatusRouteIntent,
  query?: any
) {
  const basePathname = `${getTeamURL(team)}/status`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  return `${basePathname}/${intent}${queryPathName}`
}

export function getWorkspaceHref(
  workspace: SerializedWorkspace,
  team: SerializedTeam,
  intent: 'index',
  query?: any
) {
  if (workspace.default) {
    return getTeamURL(team)
  }

  const basePathname = `${getTeamURL(team)}${getWorkspaceURL(workspace)}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}

export function getTagHref(
  tag: SerializedTag,
  team: SerializedTeam,
  intent: 'index',
  query?: any
) {
  const basePathname = `${getTeamURL(team)}/labels/${encodeURIComponent(
    tag.text
  )}`
  const queryPathName = query != null ? `?${querystring.stringify(query)}` : ''
  if (intent === 'index') {
    return `${basePathname}${queryPathName}`
  }
  return `${basePathname}/${intent}${queryPathName}`
}
