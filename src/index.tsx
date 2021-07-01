import React from 'react'
import ReactDOM from 'react-dom'
import App from './components/App'
import { V2ToastProvider } from './shared/lib/stores/toast'
import { V2WindowProvider } from './shared/lib/stores/window'
import { V2DialogProvider } from './shared/lib/stores/dialog'
import { V2ModalProvider } from './shared/lib/stores/modal'
import { V2ContextMenuProvider } from './shared/lib/stores/contextMenu'
import { V2SidebarCollapseProvider } from './lib/v2/stores/sidebarCollapse'
import { DbProvider } from './lib/db'
import { RouterProvider } from './lib/router'
import { combineProviders } from './lib/context'
import { PreferencesProvider } from './lib/preferences'
import { GeneralStatusProvider } from './lib/generalStatus'
import { PreviewStyleProvider } from './lib/preview'
import { AnalyticsProvider } from './lib/analytics'
import { StorageRouterProvider } from './lib/storageRouter'
import { SearchModalProvider } from './lib/searchModal'
import { CheckedFeaturesProvider } from './lib/checkedFeatures'
import { BoostHubStoreProvider } from './lib/boosthub'
import { CloudIntroModalProvider } from './lib/cloudIntroModal'
import { MigrationProvider } from './lib/migrate/store'
import { DialogProvider } from './lib/dialog'
import { LocalSpaceSidebarSearchProvider } from './lib/search/stores/store'

const V2CombinedProvider = combineProviders(
  V2ToastProvider,
  V2SidebarCollapseProvider,
  V2WindowProvider,
  V2ContextMenuProvider,
  V2ModalProvider,
  V2DialogProvider,
  LocalSpaceSidebarSearchProvider
)

const CombinedProvider = combineProviders(
  V2CombinedProvider,
  BoostHubStoreProvider,
  SearchModalProvider,
  PreviewStyleProvider,
  MigrationProvider,
  GeneralStatusProvider,
  DialogProvider,
  DbProvider,
  AnalyticsProvider,
  PreferencesProvider,
  StorageRouterProvider,
  RouterProvider,
  CheckedFeaturesProvider,
  CloudIntroModalProvider
)

function render(Component: typeof App) {
  let rootDiv = document.getElementById('root')
  if (rootDiv == null) {
    rootDiv = document.createElement('div', {})
    rootDiv.setAttribute('id', 'root')
    document.body.appendChild(rootDiv)
  }
  ReactDOM.render(
    <CombinedProvider>
      <Component />
    </CombinedProvider>,
    document.getElementById('root')
  )
}

if (module.hot != null) {
  module.hot.accept('./components/App', () => {
    render(App)
  })
}
render(App)
