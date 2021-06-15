import React, { useMemo } from 'react'
import {
  getTeamIndexPageData,
  TeamShowPageResponseBody,
} from '../../../cloud/api/pages/teams'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import ContentManager from '../organisms/ContentManager'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../cloud/lib/stores/nav'
import { SerializedWorkspace } from '../../../cloud/interfaces/db/workspace'
import AppLayout from '../layouts/AppLayout'

const TeamIndex = ({ pageWorkspace }: TeamShowPageResponseBody) => {
  const { team, currentUserIsCoreMember } = usePage()
  const { docsMap, foldersMap } = useNav()

  const childFolders = useMemo(() => {
    if (pageWorkspace == null) {
      return []
    }
    return [...foldersMap.values()].filter(
      (folder) =>
        folder.workspaceId === pageWorkspace.id && folder.parentFolderId == null
    )
  }, [foldersMap, pageWorkspace])

  const childDocs = useMemo(() => {
    if (pageWorkspace == null) {
      return []
    }
    return [...docsMap.values()].filter(
      (doc) =>
        doc.workspaceId === pageWorkspace.id && doc.parentFolderId == null
    )
  }, [docsMap, pageWorkspace])

  const workspaceMap = useMemo(() => {
    const map = new Map<string, SerializedWorkspace>()
    map.set(pageWorkspace.id, pageWorkspace)
    return map
  }, [pageWorkspace])

  if (team == null) {
    return <div></div>
  }
  return (
    <AppLayout>
      <ContentManager
        team={team}
        documents={childDocs}
        folders={childFolders}
        workspacesMap={workspaceMap}
        currentWorkspaceId={pageWorkspace.id}
        currentUserIsCoreMember={currentUserIsCoreMember}
      />
    </AppLayout>
  )
}

TeamIndex.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getTeamIndexPageData(params)
  return result
}

export default TeamIndex
