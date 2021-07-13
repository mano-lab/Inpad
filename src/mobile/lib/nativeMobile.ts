type AgentType = 'ios-native' | 'android-native' | 'others'
export const agentType: AgentType = window.navigator.userAgent.match(
  'BoostNote-Mobile-iOS'
)
  ? 'ios-native'
  : window.navigator.userAgent.match('BoostNote-Mobile-Android')
  ? 'android-native'
  : 'others'

type PostMessageBody = OpenLinkMessageBody | OpenAuthLinkMessageBody

interface OpenLinkMessageBody {
  type: 'open-link'
  url: string
}

interface OpenAuthLinkMessageBody {
  type: 'open-auth-link'
  state: string
  url: string
}

export function sendPostMessage(message: PostMessageBody) {
  if (agentType === 'ios-native') {
    ;(window as any).webkit.messageHandlers.callback.postMessage(message)
  } else if (agentType === 'android-native') {
    if (message.type === 'open-link') {
      ;(window as any).Android.openUrl(message.url)
    } else if (message.type === 'open-auth-link') {
      ;(window as any).Android.openAuthUrl(message.url, message.state)
    }
  }
}
