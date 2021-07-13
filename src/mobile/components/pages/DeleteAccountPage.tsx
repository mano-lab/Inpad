import React, { useCallback, useState } from 'react'
import styled from '../../../shared/lib/styled'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import ErrorPage from '../../../cloud/components/organisms/error/ErrorPage'
import { useDialog, DialogIconTypes } from '../../../shared/lib/stores/dialog'
import { useTranslation } from 'react-i18next'
import { Spinner } from '../../../cloud/components/atoms/Spinner'
import { deleteUser } from '../../../cloud/api/users'
import { UserFeedbackFormData } from '../../../cloud/components/organisms/FeedbackForm/types'
import { useToast } from '../../../shared/lib/stores/toast'
import NavigationBarContainer from '../atoms/NavigationBarContainer'
import Button from '../../../shared/components/atoms/Button'
import useSignOut from '../../lib/signOut'

const AccountDeletePage = () => {
  const { globalData } = useGlobalData()

  const { currentUser } = globalData

  const [sendingRemoval, setSendingRemoval] = useState<boolean>(false)
  const { messageBox } = useDialog()
  const { pushMessage } = useToast()
  const { t } = useTranslation()
  const signOut = useSignOut()

  const [feedback, setFeedback] = useState<UserFeedbackFormData>({
    needFeatures: false,
    needCheaper: false,
    needIntegrations: false,
  })

  const updateFeedback = useCallback(
    (obj: Partial<UserFeedbackFormData>) => {
      setFeedback((prev) => {
        return {
          ...prev,
          ...obj,
        }
      })
    },
    [setFeedback]
  )

  const deleteHandler = useCallback(async () => {
    if (currentUser == null) {
      return
    }

    messageBox({
      title: `Delete your account?`,
      message: `Are you sure to delete this account and all of its content? Your 1-man teams and all of their documents will be removed alongside it.`,
      iconType: DialogIconTypes.Warning,
      buttons: [
        {
          variant: 'secondary',
          label: 'Cancel',
          cancelButton: true,
          defaultButton: true,
        },
        {
          variant: 'danger',
          label: 'Delete',
          onClick: async () => {
            setSendingRemoval(true)
            try {
              await deleteUser(currentUser.id, feedback)
              signOut()
            } catch (error) {
              pushMessage({
                title: 'Error',
                description: error.message,
              })
              setSendingRemoval(false)
            }
          },
        },
      ],
    })
  }, [messageBox, currentUser, pushMessage, feedback, signOut])

  if (currentUser == null) {
    return (
      <ErrorPage
        error={{
          name: 'Forbidden',
          message: 'You need to login in order to access this content.',
        }}
      />
    )
  }

  return (
    <Container>
      <NavigationBarContainer label='Delete Account' />
      <div className='body'>
        <p>
          Please let us know the reasons why so that we can further improve our
          product.
        </p>
        <div className='body__form'>
          <div className='body__form__control'>
            <label className='body__form__control__checkbox'>
              <input
                type='checkbox'
                checked={feedback.needFeatures}
                onClick={(event) =>
                  updateFeedback({
                    needFeatures: (event.target as HTMLInputElement).checked,
                  })
                }
              />
              I need more features
            </label>
            {feedback.needFeatures && (
              <textarea
                className='body__form__control__extraTextarea'
                value={feedback.features}
                onChange={(event) =>
                  updateFeedback({
                    features: event.target.value,
                  })
                }
                placeholder='What kind of features do you want?'
              />
            )}
          </div>

          <div className='body__form__control'>
            <label className='body__form__control__checkbox'>
              <input
                type='checkbox'
                checked={feedback.needIntegrations}
                onClick={(event) =>
                  updateFeedback({
                    needIntegrations: (event.target as HTMLInputElement)
                      .checked,
                  })
                }
              />
              I need more integrations
            </label>

            {feedback.needIntegrations && (
              <textarea
                className='body__form__control__extraTextarea'
                value={feedback.integrations}
                onChange={(event) =>
                  updateFeedback({
                    integrations: event.target.value,
                  })
                }
                placeholder='What kind of integrations do you want?'
              />
            )}
          </div>

          <div className='body__form__control'>
            <label className='body__form__control__checkbox'>
              <input
                type='checkbox'
                checked={feedback.needCheaper}
                onClick={(event) =>
                  updateFeedback({
                    needCheaper: (event.target as HTMLInputElement).checked,
                  })
                }
              />
              Pricing is too steep
            </label>
            {feedback.needCheaper && (
              <textarea
                className='body__form__control__extraTextarea'
                value={feedback.price}
                placeholder='What would be the proper price for you?'
                onChange={(event) =>
                  updateFeedback({
                    price: event.target.value,
                  })
                }
              />
            )}
          </div>

          <div className='body__form__control'>
            <Button
              className='body__form__control__button'
              variant='danger'
              disabled={sendingRemoval}
              onClick={deleteHandler}
            >
              {sendingRemoval ? <Spinner /> : t('general.delete')}
            </Button>
          </div>
        </div>
      </div>
    </Container>
  )
}

export default AccountDeletePage

const Container = styled.div`
  .body {
    padding: ${({ theme }) => theme.sizes.spaces.md}px;
  }
  .body__form__control {
    margin-bottom: ${({ theme }) => theme.sizes.spaces.md}px;

    input[type='checkbox'] {
      margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
    }
  }

  .body__form__control__checkbox {
    display: block;
  }
  .body__form__control__extraTextarea {
    display: block;
    margin-top: ${({ theme }) => theme.sizes.spaces.sm}px;
    width: 100%;
    height: 50px;
    padding: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
  .body__form__control__button {
    width: 100%;
  }
`
