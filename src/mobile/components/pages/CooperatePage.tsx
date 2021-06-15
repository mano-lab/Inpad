import React, { useState } from 'react'
import Button from '../../../shared/components/atoms/Button'
import { useRouter } from '../../../cloud/lib/router'
import { createTeam } from '../../../cloud/api/teams'
import { getTeamLinkHref } from '../../lib/href'
import { getDocLinkHref } from '../../../cloud/components/atoms/Link/DocLink'

const CooperatePage = () => {
  const [personalSpace, setPersonalSpace] = useState(false)
  const { push } = useRouter()
  const [creatingTeam, setCreatingTeam] = useState(false)

  return (
    <div>
      <Button
        onClick={() => {
          push('/')
        }}
      >
        Back
      </Button>
      <h2>How are you planning to use Boost Note?</h2>
      <p>We&apos;ll streamline your setup experience accordingly.</p>

      <label>
        <input
          type='radio'
          checked={personalSpace}
          onClick={() => {
            setPersonalSpace(true)
          }}
        />{' '}
        Personal
      </label>
      <label>
        <input
          type='radio'
          checked={!personalSpace}
          onClick={() => {
            setPersonalSpace(false)
          }}
        />{' '}
        Team
      </label>

      <Button
        disabled={creatingTeam}
        onClick={async () => {
          if (personalSpace) {
            setCreatingTeam(true)
            try {
              const createTeamResult = await createTeam({
                personal: true,
              })
              const destinationHref =
                createTeamResult.doc == null
                  ? getTeamLinkHref(createTeamResult.team, 'index')
                  : getDocLinkHref(
                      createTeamResult.doc,
                      createTeamResult.team,
                      'index'
                    )
              push(destinationHref)
            } catch (error) {
              console.error(error)
              setCreatingTeam(false)
            }
          } else {
            push('/cooperate/team')
          }
        }}
      >
        Continue
      </Button>
    </div>
  )
}

export default CooperatePage
