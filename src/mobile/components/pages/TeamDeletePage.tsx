import React, { useCallback, useState } from 'react'
import styled from '../../../cloud/lib/styled'
import Container from '../../../cloud/components/layouts/Container'
import Page from '../../../cloud/components/Page'
import { useDialog, DialogIconTypes } from '../../../shared/lib/stores/dialog'
import { useToast } from '../../../shared/lib/stores/toast'
import { useTranslation } from 'react-i18next'
import CustomButton from '../../../cloud/components/atoms/buttons/CustomButton'
import { Spinner } from '../../../cloud/components/atoms/Spinner'
import FeedbackForm from '../../../cloud/components/organisms/FeedbackForm'
import { UserFeedbackFormData } from '../../../cloud/components/organisms/FeedbackForm/types'
import {
  DeleteTeamPageResponseBody,
  getDeleteTeamPageData,
} from '../../../cloud/api/pages/teams/delete'
import { destroyTeam } from '../../../cloud/api/teams'
import { sendFeedback } from '../../../cloud/api/feedback'
import { useElectron } from '../../../cloud/lib/stores/electron'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import { useRouter } from '../../../cloud/lib/router'

const DeleteTeamPage = ({ team }: DeleteTeamPageResponseBody) => {
  const [sendingRemoval, setSendingRemoval] = useState<boolean>(false)
  const { messageBox } = useDialog()
  const { pushMessage } = useToast()
  const { push } = useRouter()
  const { t } = useTranslation()
  const { usingElectron, sendToElectron } = useElectron()

  const [feedback, setFeedback] = useState<UserFeedbackFormData>({
    needFeatures: false,
    needCheaper: false,
    needIntegrations: false,
  })

  const onChangeFeedbackHandler = useCallback(
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
    messageBox({
      title: `Delete [${team.name}]?`,
      message: `Are you sure to delete this team and all of its content? You will not be able to revert this action.`,
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
              const { redirectTo } = await destroyTeam(team.id)
              try {
                await sendFeedback(feedback)
              } catch (error) {
              } finally {
                if (usingElectron) {
                  sendToElectron('team-delete', team)
                } else {
                  push(redirectTo)
                }
              }
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
  }, [
    messageBox,
    team,
    pushMessage,
    push,
    feedback,
    sendToElectron,
    usingElectron,
  ])

  return (
    <Page>
      <Container>
        <StyledAccountDeletePage>
          <StyledAccountDeleteCard>
            <h1>Delete your team: {team.name}?</h1>

            <p>
              Please let us know the reasons why so that we can further improve
              our product.
            </p>
            <FeedbackForm
              feedback={feedback}
              onChangeFeedback={onChangeFeedbackHandler}
            />
            <CustomButton
              variant='danger'
              disabled={sendingRemoval}
              onClick={deleteHandler}
            >
              {sendingRemoval ? <Spinner /> : t('general.delete')}
            </CustomButton>
          </StyledAccountDeleteCard>
        </StyledAccountDeletePage>
      </Container>
    </Page>
  )
}

DeleteTeamPage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getDeleteTeamPageData(params)
  return result
}

const StyledAccountDeletePage = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 100vh;
`

const StyledAccountDeleteCard = styled.div`
  background-color: ${({ theme }) => theme.subtleBackgroundColor};
  color: ${({ theme }) => theme.baseTextColor};
  box-shadow: ${({ theme }) => theme.baseShadowColor};
  width: 100%;
  max-width: 1000px;
  padding: ${({ theme }) => theme.space.xlarge}px
    ${({ theme }) => theme.space.large}px;
  border-radius: 5px;

  h1,
  p {
    text-align: center;
  }

  .btn-register,
  .btn-registered {
    display: inline-block;
    margin-top: ${({ theme }) => theme.space.default}px;
  }

  .btn-register + .btn-registered {
    margin-left: ${({ theme }) => theme.space.default}px;
  }

  .btn-signin {
    display: block;
    margin: ${({ theme }) => theme.space.large}px auto
      ${({ theme }) => theme.space.small}px;
  }

  .content {
    max-width: 480px;
    width: 96%;
    margin: ${({ theme }) => theme.space.xxlarge}px auto;

    &.flex {
      display: flex;
      justify-content: space-between;
      button {
        flex: 1 1 auto;
        margin: 0 ${({ theme }) => theme.space.default}px;
      }
    }
  }

  strong {
    display: block;
    font-size: ${({ theme }) => theme.fontSizes.xlarge}px;
    margin: ${({ theme }) => theme.space.large}px 0;
  }
`

export default DeleteTeamPage
