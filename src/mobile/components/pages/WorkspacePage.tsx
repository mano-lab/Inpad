import React, { useMemo } from 'react'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { SerializedWorkspace } from '../../../cloud/interfaces/db/workspace'
import { useNav } from '../../../cloud/lib/stores/nav'
import ContentManager from '../organisms/ContentManager'
import AppLayout from '../layouts/AppLayout'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import { getWorkspaceShowPageData } from '../../../cloud/api/pages/teams/workspaces'

interface WorkspacesShowPageResponseBody {
  pageWorkspace: SerializedWorkspace
}

const WorkspacePage = ({ pageWorkspace }: WorkspacesShowPageResponseBody) => {
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
    return <AppLayout></AppLayout>
  }

  return (
    <AppLayout title={pageWorkspace.name}>
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

export default WorkspacePage

WorkspacePage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getWorkspaceShowPageData(params)
  return result
}
