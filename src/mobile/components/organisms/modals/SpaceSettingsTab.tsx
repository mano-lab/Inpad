import React, { useMemo, useState, useCallback } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { PageStoreWithTeam } from '../../../../cloud/interfaces/pageStore'
import TeamLink from '../../../../cloud/components/atoms/Link/TeamLink'
import SettingTabContent from '../../../../shared/components/organisms/Settings/atoms/SettingTabContent'
import ViewerRestrictedWrapper from '../../../../cloud/components/molecules/ViewerRestrictedWrapper'
import { useModal } from '../../../../shared/lib/stores/modal'
import { mdiDomain, mdiArrowLeft } from '@mdi/js'
import slugify from 'slugify'
import { buildIconUrl } from '../../../../cloud/api/files'
import { updateTeam, updateTeamIcon } from '../../../../cloud/api/teams'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import { useRouter } from '../../../../cloud/lib/router'
import { getTeamURL } from '../../../../cloud/lib/utils/patterns'
import { useToast } from '../../../../shared/lib/stores/toast'
import Form from '../../../../shared/components/molecules/Form'
import FormRow from '../../../../shared/components/molecules/Form/templates/FormRow'
import styled from '../../../../shared/lib/styled'
import ModalContainer from './atoms/ModalContainer'
import NavigationBarButton from '../../atoms/NavigationBarButton'
import Icon from '../../../../shared/components/atoms/Icon'
import { SettingsTabTypes } from './types'

interface SpaceSettingsTabProps {
  setActiveTab: (tabType: SettingsTabTypes | null) => void
}

const SpaceSettingsTab = ({ setActiveTab }: SpaceSettingsTabProps) => {
  const { team, currentUserPermissions } = usePage<PageStoreWithTeam>()

  const { closeAllModals } = useModal()

  const adminContent = useMemo(() => {
    if (
      currentUserPermissions == null ||
      team == null ||
      currentUserPermissions.role !== 'admin'
    ) {
      return null
    }

    return (
      <section>
        <h2>Delete Space</h2>
        <p className='text--subtle'>
          Once you delete this space we will remove all associated data. There
          is no turning back.{' '}
          <TeamLink
            intent='delete'
            team={team}
            beforeNavigate={() => closeAllModals()}
          >
            Delete
          </TeamLink>
        </p>
      </section>
    )
  }, [currentUserPermissions, team, closeAllModals])

  if (team == null) {
    return null
  }

  return (
    <ModalContainer
      left={
        <NavigationBarButton onClick={() => setActiveTab(null)}>
          <Icon path={mdiArrowLeft} /> Back
        </NavigationBarButton>
      }
      title='Members'
      closeLabel='Done'
    >
      <SettingTabContent
        description={'Manage your space settings.'}
        body={
          <ViewerRestrictedWrapper>
            <section>
              <SettingsTeamForm team={team} teamConversion={false} />
            </section>
          </ViewerRestrictedWrapper>
        }
        footer={adminContent}
      ></SettingTabContent>
    </ModalContainer>
  )
}

export default SpaceSettingsTab

interface SettingsTeamFormProps {
  team: SerializedTeam
  teamConversion?: boolean
}

const SettingsTeamForm = ({ team, teamConversion }: SettingsTeamFormProps) => {
  const [name, setName] = useState<string>(!teamConversion ? team.name : '')
  const [domain, setDomain] = useState<string>(
    !teamConversion ? team.domain : ''
  )
  const [sending, setSending] = useState(false)
  const [iconFile, setIconFile] = useState<File | null>(null)
  const [fileUrl, setFileUrl] = useState<string | null>(
    team.icon != null ? buildIconUrl(team.icon.location) : null
  )
  const { setPartialPageData } = usePage()
  const { setTeamInGlobal } = useGlobalData()
  const { pushMessage } = useToast()
  const router = useRouter()

  const slugDomain = useMemo(() => {
    if (domain == null) {
      return process.env.BOOST_HUB_BASE_URL + '/'
    }
    return (
      process.env.BOOST_HUB_BASE_URL +
      '/' +
      slugify(domain.trim().replace(/[^a-zA-Z0-9\-]/g, ''), {
        replacement: '-',
        lower: true,
      })
    )
  }, [domain])

  const changeHandler = useCallback((file: File) => {
    setIconFile(file)
    setFileUrl(URL.createObjectURL(file))
  }, [])

  const updateHandler = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      const currentTeam = team
      if (currentTeam == null || sending) {
        return
      }
      setSending(true)
      try {
        const body: any = { name }
        if (teamConversion) {
          body.domain = domain
          body.personal = false
        }
        const { team: updatedTeam } = await updateTeam(currentTeam.id, body)
        if (iconFile != null) {
          const { icon } = await updateTeamIcon(team, iconFile)
          updatedTeam.icon = icon
        }

        setPartialPageData({ team: updatedTeam })
        setTeamInGlobal(updatedTeam)
        const subPath = router.pathname.split('/')
        subPath.splice(0, 2)
        const newUrl = `${getTeamURL(updatedTeam)}${
          subPath.length > 0 ? `/${subPath.join('/')}` : ''
        }`
        router.push(newUrl)
      } catch (error) {
        pushMessage({
          title: 'Error',
          description: `Could not update your team information`,
        })
      }
      setSending(false)
    },
    [
      setSending,
      name,
      pushMessage,
      sending,
      setPartialPageData,
      setTeamInGlobal,
      router,
      team,
      domain,
      teamConversion,
      iconFile,
    ]
  )

  const label = teamConversion ? 'Team' : 'Space'

  return (
    <Form
      onSubmit={updateHandler}
      rows={[
        {
          title: 'Logo',
          items: [
            {
              type: 'image',
              props: {
                defaultUrl: fileUrl != null ? fileUrl : undefined,
                defaultIcon: mdiDomain,
                onChange: changeHandler,
                label: fileUrl == null ? 'Add a photo' : 'Change your photo',
              },
            },
          ],
        },
        {
          title: `${label} name`,
          items: [
            {
              type: 'input',
              props: {
                value: name,
                onChange: (ev) => setName(ev.target.value),
              },
            },
          ],
        },
      ]}
      submitButton={{ label: teamConversion ? 'Create' : 'Update' }}
    >
      {teamConversion && team.personal && (
        <FormRow
          row={{
            title: `${label} domain`,
            items: [
              {
                type: 'input',
                props: {
                  value: domain,
                  onChange: (ev) => setDomain(ev.target.value),
                },
              },
            ],
            description: (
              <Description>
                <div className='description'>
                  Your url will look like this:
                  <span className='underlined'>{slugDomain}</span>
                </div>
                <div className='description'>
                  Caution: You can&#39;t change it after creating your team.
                </div>
              </Description>
            ),
          }}
        />
      )}
    </Form>
  )
}

const Description = styled.div`
  .description + .description {
    margin-top: ${({ theme }) => theme.sizes.spaces.md}px;
  }

  .underlined {
    font-weight: 500;
    padding-left: ${({ theme }) => theme.sizes.spaces.sm}px;
    text-decoration: underline;
  }
`
