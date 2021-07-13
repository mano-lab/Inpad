import React from 'react'
import { getBookmarksListPageData } from '../../../cloud/api/pages/teams/bookmarks'
import BookmarkLists from '../../../cloud/components/organisms/BookmarksList'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import AppLayout from '../layouts/AppLayout'

const BookmarksListPage = () => {
  return (
    <AppLayout title='Bookmarks'>
      <BookmarkLists />
    </AppLayout>
  )
}

BookmarksListPage.getInitialProps = async (
  params: GetInitialPropsParameters
) => {
  const result = await getBookmarksListPageData(params)
  return result
}

export default BookmarksListPage
