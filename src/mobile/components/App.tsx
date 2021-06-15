import React, { useState } from 'react'
import Router from './Router'
import { RouterProvider } from '../../cloud/lib/router'
import { GlobalDataProvider } from '../../cloud/lib/stores/globalData'
// import { gaTrackingId, nodeEnv, boostHubBaseUrl } from '../../cloud/lib/consts'

import { RealtimeConnProvider } from '../../cloud/lib/stores/realtimeConn'
import { V2ToastProvider } from '../../shared/lib/stores/toast'
import { useEffectOnce } from 'react-use'
import { initAccessToken } from '../../cloud/lib/stores/electron'
import { nodeEnv } from '../../cloud/lib/consts'

const App = () => {
  const [accessTokenInitialized, setAccessTokenInitialized] = useState(false)

  useEffectOnce(() => {
    ;(async () => {
      if (nodeEnv !== 'production') {
        await initAccessToken()
      }
      setAccessTokenInitialized(true)
    })()
  })
  if (!accessTokenInitialized) {
    return <div>Fetching access token...</div>
  }

  return (
    <>
      <link href='/app/katex/katex.min.css' rel='stylesheet' />
      <link href='/app/remark-admonitions/classic.css' rel='stylesheet' />

      <V2ToastProvider>
        <GlobalDataProvider>
          <RealtimeConnProvider>
            <RouterProvider>
              <Router />
            </RouterProvider>
          </RealtimeConnProvider>
        </GlobalDataProvider>
      </V2ToastProvider>

      {/* <script
        async={true}
        src={`https://www.googletagmanager.com/gtag/js?id=${gaTrackingId}`}
      />
      <script
        dangerouslySetInnerHTML={{
          __html: `(function(i,s,o,g,r,a,m){i['GoogleAnalyticsObject']=r;i[r]=i[r]||function(){
                (i[r].q=i[r].q||[]).push(arguments)},i[r].l=1*new Date();a=s.createElement(o),
                m=s.getElementsByTagName(o)[0];a.async=1;a.src=g;m.parentNode.insertBefore(a,m)
                })(window,document,'script','//www.google-analytics.com/analytics.js','ga');
                ga('create', '${gaTrackingId}', 'auto');
                ga('send', 'pageview');`,
        }}
      /> */}

      {/* {nodeEnv === 'production' && (
        <script
          type='text/javascript'
          src={`${boostHubBaseUrl}/static/mixpanel.js`}
        />
      )} */}
    </>
  )
}

export default App
