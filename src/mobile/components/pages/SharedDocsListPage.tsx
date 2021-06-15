import React, { useMemo } from 'react'
import { getSharedDocsListData } from '../../../cloud/api/pages/teams/shared'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../cloud/lib/stores/nav'
import { useTitle } from 'react-use'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import DocOnlyContentManager from '../../../cloud/components/molecules/ContentManager/DocOnlyContentManager'
import AppLayout from '../layouts/AppLayout'

const SharedDocsListPage = () => {
  const { team, currentUserIsCoreMember } = usePage()
  const { docsMap, workspacesMap } = useNav()

  const sharedDocs = useMemo(() => {
    return [...docsMap.values()].filter((doc) => doc.shareLink != null)
  }, [docsMap])

  useTitle('Shared')

  if (team == null) {
    return <AppLayout />
  }

  return (
    <AppLayout title='Shared'>
      <DocOnlyContentManager
        team={team}
        documents={sharedDocs}
        page='shared'
        workspacesMap={workspacesMap}
        currentUserIsCoreMember={currentUserIsCoreMember}
      />
    </AppLayout>
  )
}

SharedDocsListPage.getInitialProps = async (
  params: GetInitialPropsParameters
) => {
  const result = await getSharedDocsListData(params)
  return result
}

export default SharedDocsListPage
