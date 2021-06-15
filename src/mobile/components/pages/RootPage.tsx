import React from 'react'
import { useGlobalData } from '../../../cloud/lib/stores/globalData'
import SignOutButton from '../../../cloud/components/atoms/buttons/SignOutButton'
import { mobileBaseUrl } from '../../../cloud/lib/consts'
import SignInForm from '../../../cloud/components/molecules/SignInForm'
import Button from '../../../shared/components/atoms/Button'
import { useRouter } from '../../../cloud/lib/router'

const RootPage = () => {
  const { globalData } = useGlobalData()
  const { push } = useRouter()

  if (globalData.currentUser == null) {
    return (
      <div>
        BoostNote
        <SignInForm redirectTo='http://localhost:3005' />
      </div>
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
