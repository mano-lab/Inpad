import React, { useState, useCallback } from 'react'
import Form from '../../../shared/components/molecules/Form'
import { mobileBaseUrl, boostHubBaseUrl } from '../../../cloud/lib/consts'
import { FormItemProps } from '../../../shared/components/molecules/Form/templates/FormRowItem'
import { useRouter } from '../../../cloud/lib/router'
import { createTeam, CreateTeamResponseBody } from '../../../cloud/api/teams'
import Button from '../../../shared/components/atoms/Button'
import copy from 'copy-to-clipboard'
import { getDocLinkHref, getTeamLinkHref } from '../../lib/href'

const CreateTeamPage = () => {
  const { push } = useRouter()
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
      <div>
        <h2>Invite your teammates</h2>
        <p>
          <input readOnly defaultValue={openInviteLinkHref} />

          <Button
            onClick={() => {
              copy(openInviteLinkHref)
            }}
          >
            Copy
          </Button>
        </p>

        <Button
          onClick={() => {
            push(initialTeamPageHref)
          }}
        >
          Get Started!
        </Button>
      </div>
    )
  }

  return (
    <div>
      <button
        onClick={() => {
          push('/cooperate')
        }}
      >
        Back
      </button>
      <h2>Create a team space</h2>

      <p>Please tell us your team information.</p>
      <Form
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
              <ul>
                <li>
                  Domain : {mobileBaseUrl}/
                  {teamDomain.trim().length > 0
                    ? teamDomain.trim()
                    : '[team domain]'}
                </li>
                <li>Caution : You can&apos;t change it later.</li>
              </ul>
            ),
          },
          {
            items: [
              {
                type: 'button',
                props: {
                  label: 'Createa a team',
                  onClick: submit,
                  spinning: submitting,
                  disabled: submitting,
                },
              },
            ] as FormItemProps[],
          },
        ]}
      />
    </div>
  )
}

export default CreateTeamPage
