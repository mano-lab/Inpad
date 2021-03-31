import React, { useState, useEffect, useCallback } from 'react'
import Router from './Router'
import GlobalStyle from './GlobalStyle'
import { ThemeProvider } from 'styled-components'
import { selectTheme } from '../themes'
import Dialog from './organisms/Dialog'
import { useDb } from '../lib/db'
import PreferencesModal from './PreferencesModal/PreferencesModal'
import { usePreferences } from '../lib/preferences'
import '../lib/i18n'
import '../lib/analytics'
import CodeMirrorStyle from './CodeMirrorStyle'
import ToastList from './Toast'
import styled from '../lib/styled'
import { useEffectOnce } from 'react-use'
import AppNavigator from './organisms/AppNavigator'
import { useRouter } from '../lib/router'
import { values, keys, prependNoteIdPrefix } from '../lib/db/utils'
import { useActiveStorageId } from '../lib/routeParams'
import {
  addIpcListener,
  removeIpcListener,
  setCookie,
} from '../lib/electronOnly'
import { useGeneralStatus } from '../lib/generalStatus'
import { getNoteFullItemId } from '../lib/nav'
import { useBoostNoteProtocol } from '../lib/protocol'
import {
  useBoostHub,
  getBoostHubTeamIconUrl,
  getLegacySessionCookie,
  getDesktopAccessTokenFromSessionKey,
  flushLegacySessionCookie,
  boostHubBaseUrl,
} from '../lib/boosthub'
import {
  boostHubTeamCreateEventEmitter,
  BoostHubTeamCreateEvent,
  BoostHubTeamUpdateEvent,
  boostHubTeamUpdateEventEmitter,
  BoostHubTeamDeleteEvent,
  boostHubTeamDeleteEventEmitter,
  boostHubAccountDeleteEventEmitter,
  boostHubToggleSettingsEventEmitter,
  boostHubLoginRequestEventEmitter,
  boostHubCreateLocalSpaceEventEmitter,
} from '../lib/events'
import { useRouteParams } from '../lib/routeParams'
import { useCreateWorkspaceModal } from '../lib/createWorkspaceModal'
import CreateWorkspaceModal from './organisms/CreateWorkspaceModal'
import { IpcRendererEvent } from 'electron/renderer'
import { useToast } from '../lib/toast'
import { useStorageRouter } from '../lib/storageRouter'
import ExternalStyle from './ExternalStyle'
import { useDialog, DialogIconTypes } from '../lib/dialog'

const LoadingText = styled.div`
  margin: 30px;
`

const AppContainer = styled.div`
  position: absolute;
  top: 0;
  left: 0;
  bottom: 0;
  right: 0;
  display: flex;
`

const App = () => {
  const {
    initialize,
    queueSyncingAllStorage,
    storageMap,
    getNotePathname,
  } = useDb()
  const { push, pathname, replace } = useRouter()
  const [initialized, setInitialized] = useState(false)
  const { setGeneralStatus, generalStatus } = useGeneralStatus()
  const {
    togglePreferencesModal,
    preferences,
    setPreferences,
  } = usePreferences()
  const { messageBox } = useDialog()
  const { pushMessage } = useToast()
  const { fetchDesktopGlobalData } = useBoostHub()
  const routeParams = useRouteParams()
  const { navigate: navigateToStorage } = useStorageRouter()
  const activeStorageId = useActiveStorageId()

  useEffectOnce(() => {
    const fetchDesktopGlobalDataOfCloud = async () => {
      const cloudUserInfo = preferences['cloud.user']
      let accessToken: string
      if (cloudUserInfo == null) {
        const legacyCookie = await getLegacySessionCookie()
        if (legacyCookie == null) {
          return
        }

        console.info('Get a new access token from legacy session...')
        const { token } = await getDesktopAccessTokenFromSessionKey(
          legacyCookie.value
        )
        accessToken = token

        await flushLegacySessionCookie()

        await setCookie({
          url: boostHubBaseUrl,
          name: 'desktop_access_token',
          value: token,
          expirationDate: 4766076898395,
        })

        setGeneralStatus({
          boostHubTeams: [],
        })
      } else {
        accessToken = cloudUserInfo.accessToken
      }

      const desktopGlobalData = await fetchDesktopGlobalData(accessToken)
      if (desktopGlobalData.user == null) {
        messageBox({
          title: 'Sign In',
          message: 'Your cloud access token has been expired.',
          buttons: ['Sign In Again', 'Cancel'],
          defaultButtonIndex: 0,
          iconType: DialogIconTypes.Warning,
          onClose: (value: number | null) => {
            if (value === 0) {
              push(`/app/boosthub/login`)
              setTimeout(() => {
                boostHubLoginRequestEventEmitter.dispatch()
              }, 1000)
              return
            }

            setPreferences({
              'cloud.user': undefined,
            })
            setGeneralStatus({
              boostHubTeams: [],
            })
          },
        })
        return
      }
      const user = desktopGlobalData.user
      setPreferences({
        'cloud.user': {
          id: user.id,
          uniqueName: user.uniqueName,
          displayName: user.displayName,
          accessToken,
        },
      })
      setGeneralStatus({
        boostHubTeams: desktopGlobalData.teams.map((team) => {
          return {
            id: team.id,
            name: team.name,
            domain: team.domain,
            iconUrl:
              team.icon != null
                ? getBoostHubTeamIconUrl(team.icon.location)
                : undefined,
          }
        }),
      })
      return desktopGlobalData
    }

    initialize()
      .then(async (storageMap) => {
        const localSpaces = values(storageMap)
        if (localSpaces.length > 0) {
          queueSyncingAllStorage(0)
        }

        const globalData = await fetchDesktopGlobalDataOfCloud().catch(
          (error) => {
            console.warn('There was an issue while fetching cloud space data')
            console.warn(error)
          }
        )

        const cloudSpaces = globalData != null ? globalData.teams : []

        if (
          pathname === '' ||
          pathname === '/' ||
          pathname === '/app' ||
          pathname === '/app/storages'
        ) {
          if (localSpaces.length > 0) {
            push(`/app/storages/${localSpaces[0].id}`)
          } else if (cloudSpaces.length > 0) {
            push(`/app/boosthub/teams/${cloudSpaces[0].domain}`)
          } else {
            if (globalData == null || globalData.user == null) {
              push(`/app/boosthub/login`)
            } else {
              push(`/app/boosthub/teams`)
            }
          }
        }
        setInitialized(true)
      })
      .catch((error) => {
        console.error(error)
      })
  })

  useEffect(() => {
    const noteLinkNavigateEventHandler = (
      _: IpcRendererEvent,
      noteHref: string
    ) => {
      const noteId = Array.isArray(noteHref) ? noteHref[0] : noteHref
      if (!activeStorageId) {
        pushMessage({
          title: 'Invalid navigation!',
          description: 'Cannot open note link without storage information.',
        })
      } else {
        getNotePathname(activeStorageId, prependNoteIdPrefix(noteId)).then(
          (pathname) => {
            if (pathname) {
              replace(getNoteFullItemId(activeStorageId, pathname, noteId))
            } else {
              pushMessage({
                title: 'Note link invalid!',
                description:
                  'The note link you are trying to open is invalid or from another storage.',
              })
            }
          }
        )
      }
    }
    addIpcListener('note:navigate', noteLinkNavigateEventHandler)
    return () => {
      removeIpcListener('note:navigate', noteLinkNavigateEventHandler)
    }
  }, [activeStorageId, getNotePathname, pushMessage, replace])

  const boostHubTeamsShowPageIsActive =
    routeParams.name === 'boosthub.teams.show'

  useEffect(() => {
    const handler = () => {
      if (boostHubTeamsShowPageIsActive) {
        boostHubToggleSettingsEventEmitter.dispatch()
      } else {
        togglePreferencesModal()
      }
    }
    addIpcListener('preferences', handler)
    return () => {
      removeIpcListener('preferences', handler)
    }
  }, [togglePreferencesModal, boostHubTeamsShowPageIsActive])

  useEffect(() => {
    const boostHubTeamCreateEventHandler = (event: BoostHubTeamCreateEvent) => {
      const createdTeam = event.detail.team
      setGeneralStatus((previousGeneralStatus) => {
        const teamMap =
          previousGeneralStatus.boostHubTeams!.reduce((map, team) => {
            map.set(team.id, team)
            return map
          }, new Map()) || new Map()
        teamMap.set(createdTeam.id, {
          id: createdTeam.id,
          name: createdTeam.name,
          domain: createdTeam.domain,
          iconUrl:
            createdTeam.icon != null
              ? getBoostHubTeamIconUrl(createdTeam.icon.location)
              : undefined,
        })
        return {
          boostHubTeams: [...teamMap.values()],
        }
      })
      push(`/app/boosthub/teams/${createdTeam.domain}`)
    }

    const boostHubTeamUpdateEventHandler = (event: BoostHubTeamUpdateEvent) => {
      const updatedTeam = event.detail.team
      setGeneralStatus((previousGeneralStatus) => {
        const teamMap =
          previousGeneralStatus.boostHubTeams!.reduce((map, team) => {
            map.set(team.id, team)
            return map
          }, new Map()) || new Map()
        teamMap.set(updatedTeam.id, {
          id: updatedTeam.id,
          name: updatedTeam.name,
          domain: updatedTeam.domain,
          iconUrl:
            updatedTeam.icon != null
              ? getBoostHubTeamIconUrl(updatedTeam.icon.location)
              : undefined,
        })
        return {
          boostHubTeams: [...teamMap.values()],
        }
      })
    }

    const boostHubTeamDeleteEventHandler = (event: BoostHubTeamDeleteEvent) => {
      push(`/app`)
      const deletedTeam = event.detail.team
      setGeneralStatus((previousGeneralStatus) => {
        const teamMap =
          previousGeneralStatus.boostHubTeams!.reduce((map, team) => {
            map.set(team.id, team)
            return map
          }, new Map()) || new Map()
        teamMap.delete(deletedTeam.id)
        return {
          boostHubTeams: [...teamMap.values()],
        }
      })
    }

    const boostHubAccountDeleteEventHandler = () => {
      push(`/app`)
      setPreferences({
        'cloud.user': null,
      })
      setGeneralStatus({
        boostHubTeams: [],
      })
    }

    const boostHubCreateLocalSpaceEventHandler = () => {
      push(`/app/storages`)
    }

    boostHubTeamCreateEventEmitter.listen(boostHubTeamCreateEventHandler)
    boostHubTeamUpdateEventEmitter.listen(boostHubTeamUpdateEventHandler)
    boostHubTeamDeleteEventEmitter.listen(boostHubTeamDeleteEventHandler)
    boostHubAccountDeleteEventEmitter.listen(boostHubAccountDeleteEventHandler)
    boostHubCreateLocalSpaceEventEmitter.listen(
      boostHubCreateLocalSpaceEventHandler
    )
    return () => {
      boostHubTeamCreateEventEmitter.unlisten(boostHubTeamCreateEventHandler)
      boostHubTeamUpdateEventEmitter.unlisten(boostHubTeamUpdateEventHandler)
      boostHubTeamDeleteEventEmitter.unlisten(boostHubTeamDeleteEventHandler)
      boostHubAccountDeleteEventEmitter.unlisten(
        boostHubAccountDeleteEventHandler
      )
      boostHubCreateLocalSpaceEventEmitter.unlisten(
        boostHubCreateLocalSpaceEventHandler
      )
    }
  }, [push, setPreferences, setGeneralStatus])
  const { boostHubTeams } = generalStatus
  const switchWorkspaceHandler = useCallback(
    (_event: any, index: number) => {
      const storageIds = keys(storageMap)
      const boostHubDomains = boostHubTeams.map((team) => team.domain)

      if (storageIds.length > index) {
        const targetStorageId = storageIds[index]
        navigateToStorage(targetStorageId)
      } else {
        const targetDomain = boostHubDomains[index - storageIds.length]
        if (targetDomain == null) {
          return
        }

        push(`/app/boosthub/teams/${targetDomain}`)
      }
    },
    [storageMap, boostHubTeams, navigateToStorage, push]
  )
  useEffect(() => {
    addIpcListener('switch-workspace', switchWorkspaceHandler)
    return () => {
      removeIpcListener('switch-workspace', switchWorkspaceHandler)
    }
  }, [switchWorkspaceHandler])

  useBoostNoteProtocol()

  const {
    showCreateWorkspaceModal,
    toggleShowCreateWorkspaceModal,
  } = useCreateWorkspaceModal()

  return (
    <ThemeProvider theme={selectTheme(preferences['general.theme'])}>
      <AppContainer
        onDrop={(event: React.DragEvent) => {
          event.preventDefault()
        }}
      >
        {initialized ? (
          <>
            {preferences['general.showAppNavigator'] && <AppNavigator />}
            <Router />
            {showCreateWorkspaceModal && (
              <CreateWorkspaceModal
                closeModal={toggleShowCreateWorkspaceModal}
              />
            )}
          </>
        ) : (
          <LoadingText>Loading Data...</LoadingText>
        )}
        <GlobalStyle />
        <Dialog />
        <PreferencesModal />
        <ToastList />
        <CodeMirrorStyle />
        <ExternalStyle />
      </AppContainer>
    </ThemeProvider>
  )
}

export default App
