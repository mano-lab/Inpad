import React from 'react'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import SignOutButton from '../../../cloud/components/atoms/buttons/SignOutButton'
import { mobileBaseUrl } from '../../../cloud/lib/consts'
import SignInForm from '../../../cloud/components/molecules/SignInForm'
import Button from '../../../shared/components/atoms/Button'
import { useRouter } from '../../../cloud/lib/router'
import styled from '../../../shared/lib/styled'

const RootPage = () => {
  const { globalData } = useGlobalData()
  const { push } = useRouter()

  if (globalData.currentUser == null) {
    return (
      <Container>
        <div className='intro'>
          <img
            className='intro__logo'
            src='/static/images/logo.png'
            width='80'
            height='80'
          />
          <h1 className='intro__heading'>Welcome to Boost Note!</h1>
          <p className='intro__description'>
            Boost Note is a powerful, lightspeed collaborative workspace for
            developer teams.
          </p>
        </div>
        <SignInForm redirectTo='http://localhost:3005' width='100%' />
      </Container>
    )
  }
  return (
    <div>
      BoostNote
      <div>
        Signed in as
        {globalData.currentUser.displayName}
      </div>
      {globalData.teams.map((team) => {
        return (
          <div key={team.id}>
            <Button
              onClick={() => {
                push(`/${team.domain}`)
              }}
            >
              {team.name}
            </Button>
          </div>
        )
      })}
      {globalData.teams.length === 0 && <div>There is no team</div>}
      <div>
        <Button
          onClick={() => {
            push('/cooperate')
          }}
        >
          Create a new team
        </Button>
      </div>
      <div>
        <SignOutButton redirectTo={mobileBaseUrl}></SignOutButton>
      </div>
    </div>
  )
}

export default RootPage

const Container = styled.div`
  padding: ${({ theme }) => theme.sizes.spaces.md}px;
  .intro {
    margin-top: ${({ theme }) => theme.sizes.spaces.xl}px;
  }
  .intro__logo {
  }
  .intro__heading {
    font-size: ${({ theme }) => theme.sizes.fonts.l}px;
  }
  .intro__description {
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }
`
