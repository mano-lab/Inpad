import { ChangeEventHandler } from 'react'
import { SerializedSubscription } from '../cloud/interfaces/db/subscription'
import { SidebarState } from '../shared/lib/sidebar'

export type SelectChangeEventHandler = ChangeEventHandler<HTMLSelectElement>

function createCustomEventEmitter(
  name: string
): {
  dispatch: () => void
  listen: (handler: (event: CustomEvent) => void) => void
  unlisten: (handler: (event: CustomEvent) => void) => void
}
function createCustomEventEmitter<D = any>(
  name: string
): {
  dispatch: (detail: D) => void
  listen: (handler: (event: CustomEvent<D>) => void) => void
  unlisten: (handler: (event: CustomEvent<D>) => void) => void
}
function createCustomEventEmitter<D = any>(name: string) {
  return {
    dispatch(detail: D) {
      window.dispatchEvent(new CustomEvent(name, { detail }))
    },
    listen(handler: (event: CustomEvent<D>) => void) {
      window.addEventListener(name, handler as (event: Event) => void)
    },
    unlisten(handler: (event: CustomEvent<D>) => void) {
      window.removeEventListener(name, handler as (event: Event) => void)
    },
  }
}

export const noteDetailFocusTitleInputEventEmitter = createCustomEventEmitter(
  'NoteDetail:focusTitleInput'
)

export const boostHubLoginRequestEventEmitter = createCustomEventEmitter(
  'BoostHub:loginRequest'
)

interface BoostHubLoginEventDetail {
  code: string
}
export type BoostHubLoginEvent = CustomEvent<BoostHubLoginEventDetail>
export const boostHubLoginEventEmitter = createCustomEventEmitter<
  BoostHubLoginEventDetail
>('BoostHub:login')

interface BoostHubNavigateRequestEventDetail {
  url: string
}
export type BoostHubNavigateRequestEvent = CustomEvent<
  BoostHubNavigateRequestEventDetail
>
export const boostHubNavigateRequestEventEmitter = createCustomEventEmitter<
  BoostHubNavigateRequestEventDetail
>('BoostHub:navigateRequest')

interface BoostHubTeamCreateEventDetail {
  team: {
    id: string
    name: string
    domain: string
    icon?: {
      location: string
    }
  }
}
export type BoostHubTeamCreateEvent = CustomEvent<BoostHubTeamCreateEventDetail>
export const boostHubTeamCreateEventEmitter = createCustomEventEmitter<
  BoostHubTeamCreateEventDetail
>('BoostHub:teamCreate')

interface BoostHubTeamUpdateEventDetail {
  team: {
    id: string
    name: string
    domain: string
    icon?: {
      location: string
    }
  }
}
export type BoostHubTeamUpdateEvent = CustomEvent<BoostHubTeamUpdateEventDetail>
export const boostHubTeamUpdateEventEmitter = createCustomEventEmitter<
  BoostHubTeamUpdateEventDetail
>('BoostHub:teamUpdate')

interface BoostHubTeamDeleteEventDetail {
  team: {
    id: string
    name: string
    domain: string
    icon?: {
      location: string
    }
  }
}
export type BoostHubTeamDeleteEvent = CustomEvent<BoostHubTeamDeleteEventDetail>
export const boostHubTeamDeleteEventEmitter = createCustomEventEmitter<
  BoostHubTeamDeleteEventDetail
>('BoostHub:teamDelete')

export const boostHubAccountDeleteEventEmitter = createCustomEventEmitter(
  'BoostHub:accountDelete'
)

export const boostHubToggleSettingsEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSettings'
)

export const boostHubReloadAllWebViewsEventEmitter = createCustomEventEmitter(
  'BoostHub:reloadAllWebViews'
)

export const boostHubCreateLocalSpaceEventEmitter = createCustomEventEmitter(
  'BoostHub:createLocalSpace'
)

export const boostHubToggleSidebarTreeEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSidebarTree'
)
export const boostHubToggleSidebarSearchEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSidebarSearch'
)
export const boostHubToggleSidebarTimelineEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSidebarTimeline'
)
export const boostHubToggleSidebarNotificationsEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSidebarNotifications'
)
export const boostHubToggleSettingsMembersEventEmitter = createCustomEventEmitter(
  'BoostHub:toggleSettingsMembers'
)

export const boostHubOpenImportModalEventEmitter = createCustomEventEmitter(
  'BoostHub:openImportModal'
)

export type boostHubSidebarStateEvent = CustomEvent<{ state: SidebarState }>
export const boostHubSidebarStateEventEmitter = createCustomEventEmitter<{
  state: SidebarState
}>('BoostHub:sidebarStateUpdate')

export const boostHubOpenDiscountModalEventEmitter = createCustomEventEmitter(
  'BoostHub:openDiscountModal'
)

export const boosthubNotificationCountsEventEmitter = createCustomEventEmitter<
  Record<string, number>
>('BoostHub:notificationCounts')

type BoostHubSubscriptionEventDetail = { subscription: SerializedSubscription }

export type BoostHubSubscriptionUpdateEvent = CustomEvent<
  BoostHubSubscriptionEventDetail
>
export const boostHubSubscriptionUpdateEventEmitter = createCustomEventEmitter<
  BoostHubSubscriptionEventDetail
>('BoostHub:subscriptionUpdate')
export type BoostHubSubscriptionDeleteEvent = CustomEvent<
  BoostHubSubscriptionEventDetail
>
export const boostHubSubscriptionDeleteEventEmitter = createCustomEventEmitter<
  BoostHubSubscriptionEventDetail
>('BoostHub:subscriptionDelete')
