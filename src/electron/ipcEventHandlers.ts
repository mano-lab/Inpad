import fetch from 'node-fetch'

export const onFetchPageTitle = async (event: Electron.IpcMainEvent, url: string) => {
  let fetchResult = {
    contentType: '',
    body: '',
    isSuccess: false,
  }
  try {
    const res = await fetch(url)
    const contentType = res.headers.get('content-type')
    if (contentType !== null) {
      fetchResult.contentType = contentType
    }
    fetchResult.body = await res.text()
    fetchResult.isSuccess = true
  } catch(e) {
    console.log(e)
  } finally {
    event.sender.send('fetch-page-title-response', fetchResult)
  }
}
