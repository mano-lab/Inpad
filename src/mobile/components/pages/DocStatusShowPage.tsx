import React, { useMemo } from 'react'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../cloud/lib/stores/nav'
import { useTitle } from 'react-use'
import { DocStatus } from '../../../cloud/interfaces/db/doc'
import ErrorLayout from '../../../shared/components/templates/ErrorLayout'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import DocOnlyContentManager from '../organisms/DocOnlyContentManager'
import { getTeamIndexPageData } from '../../../cloud/api/pages/teams'
import { useRouter } from '../../../cloud/lib/router'
import DocStatusIcon from '../../../cloud/components/atoms/DocStatusIcon'
import AppLayout from '../layouts/AppLayout'

const DocStatusShowPage = () => {
  const { team, currentUserIsCoreMember } = usePage()
  const { docsMap, initialLoadDone, workspacesMap } = useNav()
  const { pathname } = useRouter()

  const docStatus = useMemo<DocStatus>(() => {
    const [, , , status] = pathname.split('/')

    switch (status) {
      case 'paused':
        return 'paused'
      case 'completed':
        return 'completed'
      case 'archived':
        return 'archived'
      case 'in-progress':
      default:
        return 'in_progress'
    }
  }, [pathname])

  const docStatusLabel = useMemo(() => {
    const [, , , status] = pathname.split('/')

    switch (status) {
      case 'paused':
        return 'Paused'
      case 'completed':
        return 'Completed'
      case 'archived':
        return 'Archived'
      case 'in-progress':
      default:
        return 'In Progress'
    }
  }, [pathname])

  const documents = useMemo(() => {
    const docs = [...docsMap].map(([_docId, doc]) => doc)

    return docs.filter((doc) => doc.status === docStatus)
  }, [docsMap, docStatus])

  const pageTitle = useMemo(() => {
    if (team == null) {
      return 'BoostHub'
    }

    return `Docs with status - ${team.name}`
  }, [team])

  useTitle(pageTitle)

  if (!initialLoadDone) {
    return <AppLayout>Loading...</AppLayout>
  }

  if (team == null) {
    return (
      <AppLayout>
        <ErrorLayout message={'Team is missing'} />
      </AppLayout>
    )
  }

  return (
    <AppLayout
      title={
        <>
          <DocStatusIcon status={docStatus} /> {docStatusLabel}
        </>
      }
    >
      <DocOnlyContentManager
        team={team}
        documents={documents}
        workspacesMap={workspacesMap}
        currentUserIsCoreMember={currentUserIsCoreMember}
      />
    </AppLayout>
  )
}

DocStatusShowPage.getInitialProps = async (
  params: GetInitialPropsParameters
) => {
  const result = await getTeamIndexPageData(params)
  return result
}

export default DocStatusShowPage
