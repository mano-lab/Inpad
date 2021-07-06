import React, { useState } from 'react'
import Button from '../../../shared/components/atoms/Button'
import { useRouter } from '../../../cloud/lib/router'
import { createTeam } from '../../../cloud/api/teams'
import { getTeamLinkHref, getDocLinkHref } from '../../lib/href'
import styled from '../../../shared/lib/styled'
import NavigationBarContainer from '../atoms/NavigationBarContainer'
import NavigationBarButton from '../atoms/NavigationBarButton'
import Icon from '../../../shared/components/atoms/Icon'
import { mdiArrowLeft } from '@mdi/js'
import useSignOut from '../../lib/signOut'

const CooperatePage = () => {
  const [personalSpace, setPersonalSpace] = useState(false)
  const { push } = useRouter()
  const [creatingTeam, setCreatingTeam] = useState(false)

  const signOut = useSignOut()

  return (
    <Container>
      <NavigationBarContainer
        left={
          <NavigationBarButton
            onClick={() => {
              push('/')
            }}
          >
            <Icon size={20} path={mdiArrowLeft} />
            Back
          </NavigationBarButton>
        }
        label='Register'
        right={
          <NavigationBarButton onClick={signOut}>Log Out</NavigationBarButton>
        }
      />

      <div className='form'>
        <h2 className='form__heading'>
          How are you planning to use Boost Note?
        </h2>

        <p className='form__description'>
          We&apos;ll streamline your setup experience accordingly.
        </p>
        <div className='form__control'>
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
        </div>
        <div className='form__control'>
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
        </div>
        <div className='form__control'>
          <Button
            className='form__control__button'
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
      </div>
    </Container>
  )
}

export default CooperatePage

const Container = styled.div`
  .form {
    padding: ${({ theme }) => theme.sizes.spaces.md}px;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }

  .form__control {
    margin-bottom: ${({ theme }) => theme.sizes.spaces.md}px;
    label {
      display: flex;
      align-items: center;
    }
    input {
      margin-right: ${({ theme }) => theme.sizes.spaces.xsm}px;
    }
  }

  .form__control__button {
    width: 100%;
  }
`
