import React, { useMemo } from 'react'
import Page from '../../../cloud/components/Page'
import DefaultLayout from '../../../cloud/components/layouts/DefaultLayout'
import {
  getResourceShowPageData,
  ResourceShowPageResponseBody,
} from '../../../cloud/api/pages/teams'
import DocPage from './DocPage'
import FolderPage from './FolderPage'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'

const ResourceIndex = (props: ResourceShowPageResponseBody) => {
  const content = useMemo(() => {
    let innerPage

    switch (props.type) {
      case 'doc':
        innerPage = (
          <DocPage
            doc={props.pageDoc}
            contributors={props.contributors || []}
            backLinks={props.backLinks || []}
            revisionHistory={props.revisionHistory || []}
          />
        )
        break

      case 'folder':
        innerPage = <FolderPage />
        break
    }

    return (
      <Page>
        <DefaultLayout>{innerPage}</DefaultLayout>
      </Page>
    )
  }, [props])

  return content
}

ResourceIndex.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getResourceShowPageData(params)
  return result
}

export default ResourceIndex
