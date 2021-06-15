import React, { useMemo, useCallback, useState } from 'react'
import Container from '../../../cloud/components/layouts/Container'
import TitleComponent from '../../../cloud/components/atoms/TitleComponent'
import styled from '../../../cloud/lib/styled'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import CustomButton from '../../../cloud/components/atoms/buttons/CustomButton'
import ErrorBlock from '../../../cloud/components/atoms/ErrorBlock'
import { useRouter } from '../../../cloud/lib/router'
import { createPermissions } from '../../../cloud/api/teams/permissions'
import { getTeamURL } from '../../../cloud/lib/utils/patterns'
import SignInForm from '../../../cloud/components/molecules/SignInForm'
import {
  TeamOpenInvitePageData,
  getTeamOpenInvitePageData,
} from '../../../cloud/api/pages/teams/invite'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import AppLayout from '../layouts/AppLayout'

const OpenInvitePage = ({ invite }: TeamOpenInvitePageData) => {
  const { globalData } = useGlobalData()
  const { currentUser } = globalData
  const [sending, setSending] = useState<boolean>(false)
  const [error, setError] = useState<unknown>()
  const router = useRouter()

  const acceptInvite = useCallback(async () => {
    if (currentUser == null) {
      return
    }

    setSending(true)
    try {
      const { userPermissions } = await createPermissions(invite.team!, {
        userId: currentUser.id,
        inviteId: invite.slug,
        type: 'open',
      })
      router.push(getTeamURL(userPermissions.team))
    } catch (error) {
      setError(error)
      setSending(false)
    }
  }, [currentUser, invite, router])

  const pageContent = useMemo(() => {
    if (currentUser == null) {
      return (
        <div className='content text-center'>
          <p>You will need to login in order to accept the invitation</p>
          <div className='content text-center flex column'>
            <div>
              <h3>Sign in</h3>
              <SignInForm openInviteSlug={invite.slug} disabled={sending} />
            </div>
          </div>
        </div>
      )
    } else {
      return (
        <div className='content text-center flex'>
          <CustomButton
            variant='primary'
            disabled={sending}
            onClick={() => acceptInvite()}
            style={{ margin: 'auto' }}
          >
            Join
          </CustomButton>
        </div>
      )
    }
  }, [currentUser, invite.slug, sending, acceptInvite])

  return (
    <AppLayout title='Join a Team'>
      <Container style={{ flex: '0 0 auto' }}>
        <TitleComponent />
      </Container>
      <StyledInvitePageContent>
        <StyledInvitePageCard>
          <p>
            You have been invited to: <strong>{invite.team!.name}</strong>
          </p>
          <hr />
          {pageContent}
          {error != null && (
            <ErrorBlock style={{ marginTop: 20 }} error={error} />
          )}
        </StyledInvitePageCard>
      </StyledInvitePageContent>
    </AppLayout>
  )
}

const StyledInvitePageContent = styled.div`
  width: 100%;
  flex: 1 1 auto;
  position: relative;
  display: flex;
  flex-direction: column;
  justify-content: center;
  overflow: hidden;
`

const StyledInvitePageCard = styled.div`
  width: 500px;
  max-width: 96%;
  flex: initial 1 0;
  height: auto;
  overflow: hidden auto;
  margin: 20px auto;
  padding: ${({ theme }) => theme.space.xlarge}px
    ${({ theme }) => theme.space.large}px;
  background-color: ${({ theme }) => theme.baseBackgroundColor};
  box-shadow: 0 2px 40px 0 rgba(0, 0, 0, 0.06);
  border-radius: 5px;
  text-align: center;

  h1 {
    margin-bottom: ${({ theme }) => theme.space.default}px;
  }
  hr {
    margin: ${({ theme }) => theme.space.large}px 0;
  }
  button + button {
    margin-left: ${({ theme }) => theme.space.small}px;
  }
`

OpenInvitePage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getTeamOpenInvitePageData(params)
  return result
}

export default OpenInvitePage
