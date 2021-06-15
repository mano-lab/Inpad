import { SerializedDoc } from '../../cloud/interfaces/db/doc'
import { SerializedTeam } from '../../cloud/interfaces/db/team'
import { DocLinkIntent } from '../../cloud/components/atoms/Link/DocLink'
import querystring from 'querystring'
import { getDocURL, getTeamURL } from '../../cloud/lib/utils/patterns'
import {
  TeamIdProps,
  TeamLinkIntent,
} from '../../cloud/components/atoms/Link/TeamLink'

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
