import { useCallback, useEffect, useMemo } from 'react'
import Analytics from '@aws-amplify/analytics'
import Auth from '@aws-amplify/auth'
import { usePreferences, useFirstUser } from './preferences'
import { DbStore } from './db'
import { useEffectOnce } from 'react-use'
import { osName } from './platform'
import isElectron from 'is-electron'

const amplifyConfig = {
  Auth: {
    identityPoolId: process.env.AMPLIFY_AUTH_IDENTITY_POOL_ID,
    region: process.env.AMPLIFY_AUTH_REGION,
  },
}

const analyticsConfig = {
  AWSPinpoint: {
    appId: process.env.AMPLIFY_PINPOINT_APPID,
    region: process.env.AMPLIFY_PINPOINT_REGION,
    mandatorySignIn: false,
  },
}
Auth.configure(amplifyConfig)
Analytics.configure(analyticsConfig)

function reportViaPinpoint(name: string, attributes: any) {
  if (process.env.NODE_ENV === 'production') {
    Analytics.record({ name, attributes })
  }
}

export function useAnalytics() {
  const { preferences } = usePreferences()
  const analyticsEnabled = preferences['general.enableAnalytics']
  const user = useFirstUser()

  useEffectOnce(() => {
    Analytics.record('init')
  })

  const userId = useMemo(() => {
    return user != null ? user.id.toString() : null
  }, [user])

  useEffect(() => {
    const endpointConfig: any = {
      attributes: {
        target: [osName],
        target2: [`${isElectron() ? 'electron' : 'web'}:${osName}`],
      },
    }

    if (userId != null) {
      endpointConfig.userId = userId
      endpointConfig.attributes.userId = [userId]
    }
    Analytics.updateEndpoint(endpointConfig)
  }, [userId])

  const report = useCallback(
    (name: string, attributes?: any) => {
      if (analyticsEnabled) {
        reportViaPinpoint(name, attributes)
      }
    },
    [analyticsEnabled]
  )

  return {
    report,
  }
}

export const analyticsEvents = {
  addNote: 'Note.Add',
  editNote: 'Note.Edit',
  deleteNote: 'Note.Delete',
  addTag: 'Tag.Add',
  addStorage: 'Storage.Add',
  addFolder: 'Folder.Add',
  colorTheme: 'ColorTheme.Edit',
  editorTheme: 'EditorTheme.Edit',
}

export function wrapDbStoreWithAnalytics(hook: () => DbStore): () => DbStore {
  return () => {
    const { report } = useAnalytics()
    const {
      createNote,
      updateNote,
      trashNote,
      createStorage,
      createFolder,
      ...rest
    } = hook()
    return {
      createNote: useCallback(
        (...args: Parameters<typeof createNote>) => {
          report(analyticsEvents.addNote)
          return createNote(...args)
        },
        [createNote, report]
      ),
      updateNote: useCallback(
        (...args: Parameters<typeof updateNote>) => {
          report(analyticsEvents.editNote)
          return updateNote(...args)
        },
        [updateNote, report]
      ),
      trashNote: useCallback(
        (...args: Parameters<typeof trashNote>) => {
          report(analyticsEvents.deleteNote)
          return trashNote(...args)
        },
        [trashNote, report]
      ),
      createStorage: useCallback(
        (...args: Parameters<typeof createStorage>) => {
          report(analyticsEvents.addStorage)
          return createStorage(...args)
        },
        [createStorage, report]
      ),
      createFolder: useCallback(
        (...args: Parameters<typeof createFolder>) => {
          report(analyticsEvents.addFolder)
          return createFolder(...args)
        },
        [createFolder, report]
      ),
      ...rest,
    }
  }
}
