import React, { useCallback, useState, useMemo } from 'react'
import ModalFormWrapper from './atoms/ModalFormWrapper'
import { useToast } from '../../../../shared/lib/stores/toast'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import { UserEmailNotificationType } from '../../../../cloud/interfaces/db/userSettings'
import { updateUserIcon, saveUserInfo } from '../../../../cloud/api/users'
import { saveUserSettings } from '../../../../cloud/api/users/settings'
import Form from '../../../../shared/components/molecules/Form'
import { useSettings } from '../../../../cloud/lib/stores/settings'
import { buildIconUrl } from '../../../../cloud/api/files'
import { useModal } from '../../../../shared/lib/stores/modal'
import Button from '../../../../shared/components/atoms/Button'
import { useRouter } from '../../../../cloud/lib/router'
import ModalContainer from './atoms/ModalContainer'
import NavigationBarButton from '../../atoms/NavigationBarButton'
import { SettingsTabTypes } from './types'
import { mdiArrowLeft } from '@mdi/js'
import Icon from '../../../../shared/components/atoms/Icon'

interface AccountSettingsTabProps {
  setActiveTab: (tab: SettingsTabTypes | null) => void
}

const AccountSettingsTab = ({ setActiveTab }: AccountSettingsTabProps) => {
  const { pushMessage } = useToast()
  const {
    globalData: { currentUser },
    setPartialGlobalData,
  } = useGlobalData()
  const [updating, setUpdating] = useState<boolean>(false)
  const [displayName, setDisplayName] = useState<string>(
    currentUser != null ? currentUser.displayName : ''
  )
  const [iconFile, setIconFile] = useState<File | null>(null)
  const { emailNotifications } = useSettings()
  const [currentEmailNotifications, setCurrentEmailNotifications] = useState<
    UserEmailNotificationType | 'never'
  >(emailNotifications == null ? 'never' : emailNotifications)
  const { closeAllModals } = useModal()

  const onChangeHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setDisplayName(event.target.value)
    },
    [setDisplayName]
  )

  const iconUrl = useMemo(() => {
    if (currentUser == null || currentUser.icon == null) {
      return undefined
    }
    return buildIconUrl(currentUser.icon.location)
  }, [currentUser])

  const selectCurrentEmailNotifications = useCallback(
    (value: string | 'never') => {
      let targetedValue: UserEmailNotificationType | 'never'
      switch (value) {
        case 'daily':
        case 'weekly':
          targetedValue = value
          break
        case 'never':
        default:
          targetedValue = 'never'
      }
      setCurrentEmailNotifications(targetedValue)
    },
    []
  )
  const updateHandler = useCallback(async () => {
    if (updating) {
      return
    }
    setUpdating(true)
    try {
      await saveUserInfo({ displayName })
      const user = { ...currentUser!, displayName }
      if (iconFile != null) {
        const { icon } = await updateUserIcon(iconFile)
        user.icon = icon
      }
      if (currentEmailNotifications != emailNotifications) {
        const { settings } = await saveUserSettings({
          notifications: {
            summary:
              currentEmailNotifications === 'never'
                ? undefined
                : currentEmailNotifications,
          },
        })
        setPartialGlobalData({ currentUserSettings: settings })
      }
      setPartialGlobalData({ currentUser: user })
    } catch (error) {
      pushMessage({
        title: 'Error',
        description: `Could not update your user information`,
      })
    }
    setUpdating(false)
  }, [
    displayName,
    pushMessage,
    updating,
    setUpdating,
    currentEmailNotifications,
    emailNotifications,
    setPartialGlobalData,
    currentUser,
    iconFile,
  ])

  const { push } = useRouter()

  return (
    <ModalContainer
      left={
        <NavigationBarButton onClick={() => setActiveTab(null)}>
          <Icon path={mdiArrowLeft} /> Back
        </NavigationBarButton>
      }
      title='Settings'
      closeLabel='Done'
    >
      <ModalFormWrapper>
        {currentUser == null ? null : (
          <Form
            onSubmit={updateHandler}
            rows={[
              {
                title: 'Profile Picture',
                items: [
                  {
                    type: 'image',
                    props: { defaultUrl: iconUrl, onChange: setIconFile },
                  },
                ],
              },
              {
                title: 'Name',
                items: [
                  {
                    type: 'input',
                    props: { value: displayName, onChange: onChangeHandler },
                  },
                ],
              },
              {
                title: 'Email updates',
                items: [
                  {
                    type: 'select--string',
                    props: {
                      value: currentEmailNotifications,
                      onChange: selectCurrentEmailNotifications,
                      isDisabled: updating,
                      options: ['daily', 'weekly', 'never'],
                    },
                  },
                ],
              },
            ]}
            submitButton={{
              variant: 'primary',
              spinning: updating,
              label: 'Update',
              disabled: updating,
            }}
          />
        )}

        <hr />

        <h2>Delete Account</h2>
        <p className='text--subtle'>
          You may delete your account at any time, note that this is
          unrecoverable.
        </p>
        <Button
          variant='danger'
          onClick={() => {
            closeAllModals()
            push('/account/delete')
          }}
        >
          Delete
        </Button>
      </ModalFormWrapper>
    </ModalContainer>
  )
}

export default AccountSettingsTab
