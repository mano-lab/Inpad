import React, { useState, useCallback } from 'react'
import Form from '../../../shared/components/molecules/Form'
import { mobileBaseUrl, boostHubBaseUrl } from '../../../cloud/lib/consts'
import { FormItemProps } from '../../../shared/components/molecules/Form/templates/FormRowItem'
import { useRouter } from '../../../cloud/lib/router'
import { createTeam, CreateTeamResponseBody } from '../../../cloud/api/teams'
import Button from '../../../shared/components/atoms/Button'
import copy from 'copy-to-clipboard'
import { getDocLinkHref, getTeamLinkHref } from '../../lib/href'
import styled from '../../../shared/lib/styled'
import { mdiArrowLeft } from '@mdi/js'
import Icon from '../../../shared/components/atoms/Icon'
import NavigationBarButton from '../atoms/NavigationBarButton'
import NavigationBarContainer from '../atoms/NavigationBarContainer'
import useSignOut from '../../lib/signOut'

const CreateTeamPage = () => {
  const { push } = useRouter()
  const signOut = useSignOut()
  const [result, setResult] = useState<null | CreateTeamResponseBody>(null)
  const [teamName, setTeamName] = useState('')
  const [teamDomain, setTeamDomain] = useState('')

  const [submitting, setSubmitting] = useState(false)

  const submit = useCallback(async () => {
    setSubmitting(true)
    const body = {
      name: teamName,
      domain: teamDomain,
    }

    const createTeamResult = await createTeam(body)

    if (createTeamResult.openInvite == null) {
      push(`/${createTeamResult.team.domain}`)
    } else {
      setResult(createTeamResult)
      setSubmitting(false)
    }
  }, [teamName, teamDomain, push])

  if (result != null) {
    const openInviteLinkHref = `${boostHubBaseUrl}/${result.team.domain}/invite/${result.openInvite?.slug}`

    const initialTeamPageHref =
      result.doc == null
        ? getTeamLinkHref(result.team, 'index')
        : getDocLinkHref(result.doc, result.team, 'index')

    return (
      <Container>
        <NavigationBarContainer label='Register' />
        <div className='body'>
          <h2>Invite your teammates</h2>
          <div className='body__inputGroup'>
            <input
              className='body__inputGroup__input'
              readOnly
              defaultValue={openInviteLinkHref}
            />

            <Button
              className='body__inputGroup__button'
              onClick={() => {
                copy(openInviteLinkHref)
              }}
            >
              Copy
            </Button>
          </div>

          <Button
            className='body__form__button'
            onClick={() => {
              push(initialTeamPageHref)
            }}
          >
            Get Started!
          </Button>
        </div>
      </Container>
    )
  }

  return (
    <Container>
      <NavigationBarContainer
        left={
          <NavigationBarButton
            onClick={() => {
              push('/cooperate')
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
      <div className='body'>
        <h2>Create a team space</h2>

        <p className='form__description'>
          Please tell us your team information.
        </p>

        <Form
          className='body__form'
          rows={[
            {
              title: 'Team name',
              required: true,
              items: [
                {
                  type: 'input',
                  props: {
                    type: 'text',
                    value: teamName,
                    onChange: (event) => {
                      setTeamName(event.target.value)
                    },
                  },
                },
              ] as FormItemProps[],
            },
            {
              title: 'Team domain',
              items: [
                {
                  type: 'input',
                  props: {
                    value: teamDomain,
                    onChange: (event) => {
                      setTeamDomain(event.target.value)
                    },
                  },
                },
              ] as FormItemProps[],
            },
            {
              description: (
                <ul className='body__form__list'>
                  <li className='body__form__list__item'>
                    Domain : {mobileBaseUrl}/
                    {teamDomain.trim().length > 0
                      ? teamDomain.trim()
                      : '[team domain]'}
                  </li>
                  <li className='body__form__list__item'>
                    Caution : You can&apos;t change it later.
                  </li>
                </ul>
              ),
            },
          ]}
        />

        <div>
          <Button
            className='body__form__button'
            onClick={submit}
            disabled={submitting}
          >
            Create a team
          </Button>
        </div>
      </div>
    </Container>
  )
}

export default CreateTeamPage

const Container = styled.div`
  .body {
    padding: ${({ theme }) => theme.sizes.spaces.md}px;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }
  .body__form {
    width: 100%;
  }
  .body__form__list {
    padding: 0 ${({ theme }) => theme.sizes.spaces.md}px;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.md}px;
  }

  .body__form__list__item {
    margin-bottom: ${({ theme }) => theme.sizes.spaces.sm}px;
  }

  .body__form__button {
    width: 100%;
  }

  .body__inputGroup {
    display: flex;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.md}px;
  }
  .body__inputGroup__input {
    flex: 1;
  }
  .body__inputGroup__button {
  }
`
