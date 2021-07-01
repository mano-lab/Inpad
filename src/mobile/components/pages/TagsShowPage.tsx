import React, { useMemo } from 'react'
import {
  getTagsShowPageData,
  TagsShowPageResponseBody,
} from '../../../cloud/api/pages/teams/tags'
import { useNav } from '../../../cloud/lib/stores/nav'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import ColoredBlock from '../../../cloud/components/atoms/ColoredBlock'
import { SerializedWorkspace } from '../../../cloud/interfaces/db/workspace'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import DocOnlyContentManager from '../organisms/DocOnlyContentManager'
import AppLayout from '../layouts/AppLayout'

const TagsShowPage = ({ pageTag: pagePropsTag }: TagsShowPageResponseBody) => {
  const { docsMap, tagsMap, workspacesMap } = useNav()
  const { team, currentUserIsCoreMember } = usePage()

  const pageTag = useMemo(() => {
    return tagsMap.get(pagePropsTag.id)
  }, [tagsMap, pagePropsTag.id])

  const docs = useMemo(() => {
    if (pageTag == null) {
      return []
    }

    return [...docsMap.values()].filter((doc) => {
      return doc.tags.map((tag) => tag.id).includes(pageTag.id)
    })
  }, [docsMap, pageTag])

  const relatedWorkspaces = useMemo(() => {
    const workspacesIds = new Set<string>()
    docs.forEach((doc) => {
      workspacesIds.add(doc.workspaceId)
    })

    return [...workspacesMap.values()].reduce((acc, val) => {
      if (workspacesIds.has(val.id)) {
        acc.set(val.id, val)
      }
      return acc
    }, new Map<string, SerializedWorkspace>())
  }, [docs, workspacesMap])

  if (team == null) {
    return <AppLayout />
  }

  if (pageTag == null) {
    return (
      <AppLayout>
        <ColoredBlock variant='danger' style={{ marginTop: '40px' }}>
          <h3>Oops...</h3>
          <p>The Tag has been deleted.</p>
        </ColoredBlock>
      </AppLayout>
    )
  }

  return (
    <AppLayout>
      <DocOnlyContentManager
        team={team}
        documents={docs}
        page='tag'
        workspacesMap={relatedWorkspaces}
        currentUserIsCoreMember={currentUserIsCoreMember}
      />
    </AppLayout>
  )
}

TagsShowPage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getTagsShowPageData(params)
  return result
}

export default TagsShowPage
