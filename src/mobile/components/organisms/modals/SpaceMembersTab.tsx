import React, { useCallback, useState, useEffect, useRef } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import {
  useDialog,
  DialogIconTypes,
} from '../../../../shared/lib/stores/dialog'
import CustomButton from '../../../../cloud/components/atoms/buttons/CustomButton'
import { SerializedUserTeamPermissions } from '../../../../cloud/interfaces/db/userTeamPermissions'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import {
  destroyPermission,
  updatePermissionRole,
} from '../../../../cloud/api/teams/permissions'
import { useSettings } from '../../../../cloud/lib/stores/settings'
import ColoredBlock from '../../../../cloud/components/atoms/ColoredBlock'
import { Spinner } from '../../../../cloud/components/atoms/Spinner'
import OpenInvitesSection from '../../../../cloud/components/molecules/OpenInviteSection'
import UserIcon from '../../../../cloud/components/atoms/UserIcon'
import styled from '../../../../cloud/lib/styled'
import { arraysAreIdentical } from '../../../../cloud/lib/utils/array'
import { getUserEmailsFromPermissions } from '../../../../cloud/api/teams/permissions/emails'
import { useRouter } from '../../../../cloud/lib/router'
import { mdiArrowLeft } from '@mdi/js'
import { useSet } from 'react-use'
import SettingsTeamForm from '../../../../cloud/components/molecules/SettingsTeamForm'
import { useToast } from '../../../../shared/lib/stores/toast'
import SettingTabContent from '../../../../shared/components/organisms/Settings/atoms/SettingTabContent'
import Button from '../../../../shared/components/atoms/Button'
import Flexbox from '../../../../shared/components/atoms/Flexbox'
import { SimpleFormSelect } from '../../../../shared/components/molecules/Form/atoms/FormSelect'
import ModalFormWrapper from './atoms/ModalFormWrapper'
import NavigationBarButton from '../../atoms/NavigationBarButton'
import Icon from '../../../../shared/components/atoms/Icon'
import ModalContainer from './atoms/ModalContainer'
import { SettingsTabTypes } from './types'

interface SpaceMembersTabProps {
  setActiveTab: (tabType: SettingsTabTypes | null) => void
}

const SpaceMembersTab = ({ setActiveTab }: SpaceMembersTabProps) => {
  const {
    team,
    permissions = [],
    setPartialPageData,
    currentUserPermissions,
  } = usePage()
  const {
    globalData: { currentUser },
  } = useGlobalData()
  const { messageBox } = useDialog()
  const { pushApiErrorMessage } = useToast()
  const { setClosed } = useSettings()
  const [sending, setSending] = useState<string>()
  const router = useRouter()
  const currentUserEmailIds = useRef<string[]>([])
  const [fetching, { add, remove }] = useSet<string>(new Set())
  const [userEmailsMap, setUserEmailsMap] = useState<Map<string, string>>(
    new Map()
  )
  const [showTeamPersonalForm, setShowTeamPersonalForm] = useState<boolean>(
    false
  )
  const mountedRef = useRef(false)

  useEffect(() => {
    mountedRef.current = true
    return () => {
      mountedRef.current = false
    }
  }, [])

  const fetchUserEmails = useCallback(
    async (teamId: string, ids: string[]) => {
      add('userEmails')
      getUserEmailsFromPermissions(teamId, ids)
        .then((res) => {
          if (!mountedRef.current) {
            return
          }
          setUserEmailsMap(() =>
            res.permissionEmails.reduce((acc, val) => {
              acc.set(val.id, val.email)
              return acc
            }, new Map<string, string>())
          )
        })
        .catch(() => {
          //
        })
        .finally(() => {
          if (!mountedRef.current) {
            return
          }
          currentUserEmailIds.current = ids
          remove('userEmails')
        })
    },
    [add, remove]
  )

  useEffect(() => {
    if (
      permissions.length === 0 ||
      fetching.has('userEmails') ||
      team == null
    ) {
      return
    }
    const permissionsCurrentIds = permissions.map((p) => p.id)
    if (
      arraysAreIdentical(currentUserEmailIds.current, permissionsCurrentIds)
    ) {
      return
    }

    fetchUserEmails(team.id, permissionsCurrentIds)
  }, [permissions, fetching, team, fetchUserEmails])

  const removePermissions = useCallback(
    async (permission: SerializedUserTeamPermissions) => {
      if (team == null) {
        return
      }

      const mboxContent = {
        title: 'Leave the team',
        message:
          'Are you sure to leave the team and not being able to access any of its content? The last team member has to completely delete the team.',
      }

      const currentUserId = currentUser != null ? currentUser.id : ''
      if (currentUserId !== permission.user.id) {
        mboxContent.title = 'Removing a member'
        mboxContent.message = `Are you sure to want removing ${permission.user.displayName} from this team`
      }

      messageBox({
        title: mboxContent.title,
        message: mboxContent.message,
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
              //remove
              setSending(`${permission.id}-delete`)
              try {
                await destroyPermission(team, permission)
                if (currentUserId === permission.user.id) {
                  router.replace(`/`)
                  setClosed(true)
                } else {
                  setPartialPageData({
                    permissions: permissions.filter(
                      (p) => p.id !== permission.id
                    ),
                  })
                }
              } catch (error) {
                pushApiErrorMessage(error)
              }
              setSending(undefined)
              return
            },
          },
        ],
      })
    },
    [
      pushApiErrorMessage,
      messageBox,
      currentUser,
      router,
      permissions,
      setPartialPageData,
      team,
      setClosed,
    ]
  )

  const changePermissionsRole = useCallback(
    async (
      targetedRole,
      userPermissions,
      targetedPermissions: SerializedUserTeamPermissions
    ) => {
      if (
        team == null ||
        userPermissions.role !== 'admin' ||
        userPermissions.id === targetedPermissions.id ||
        targetedRole === targetedPermissions.role
      ) {
        return
      }

      let mboxContent = { title: '', message: '' }
      let changeIsDemotion = false
      switch (targetedRole) {
        case 'admin':
          mboxContent = {
            title: 'Promote to admin',
            message: `This action will promote ${targetedPermissions.user.displayName}'s to an admin, he will be granted access to team management and billing information. Are you sure?`,
          }
          break
        case 'member':
          mboxContent = {
            title:
              targetedPermissions.role === 'viewer'
                ? 'Promote to member'
                : 'Demote to member',
            message: `This action will change ${targetedPermissions.user.displayName}'s role to a regular member, he will be accounted for within the subscription and can actively participate within the team. However he will be unable to access any billing information. Are you sure?`,
          }
          if (targetedPermissions.role === 'admin') {
            changeIsDemotion = true
          }
          break
        case 'viewer':
          mboxContent = {
            title: 'Demote to viewer',
            message: `This action will change ${targetedPermissions.user.displayName}'s role to a viewer. He will be removed from the subscription amount. He will be unable to edit in any way folder and documents moving forward but can still read as well as post comments. Are you sure?`,
          }
          changeIsDemotion = true
          break
      }

      messageBox({
        title: mboxContent.title,
        message: mboxContent.message,
        iconType: DialogIconTypes.Warning,
        buttons: [
          {
            variant: 'secondary',
            label: 'Cancel',
            cancelButton: true,
            defaultButton: true,
          },
          {
            variant: changeIsDemotion ? 'danger' : 'primary',
            label: changeIsDemotion ? 'Demote' : 'Promote',
            onClick: async () => {
              setSending(`${targetedPermissions.id}-change`)
              try {
                const data = await updatePermissionRole(
                  team,
                  targetedPermissions,
                  targetedRole
                )

                setPartialPageData({
                  permissions: permissions.map((p) =>
                    p.id !== data.permissions.id ? p : data.permissions
                  ),
                })
              } catch (error) {
                pushApiErrorMessage(error)
              }
              setSending(undefined)
              return
            },
          },
        ],
      })
    },
    [pushApiErrorMessage, messageBox, permissions, setPartialPageData, team]
  )

  if (currentUserPermissions == null || team == null) {
    return (
      <SettingTabContent
        title='Members'
        body={
          <ColoredBlock variant='danger'>
            You don&apos;t own any permissions.
          </ColoredBlock>
        }
      ></SettingTabContent>
    )
  }

  const currentUserIsAdmin = currentUserPermissions.role === 'admin'

  if (team.personal && showTeamPersonalForm) {
    return (
      <ModalContainer
        left={
          <NavigationBarButton onClick={() => setActiveTab(null)}>
            <Icon size={20} path={mdiArrowLeft} /> Back
          </NavigationBarButton>
        }
        title='Settings'
        closeLabel='Done'
      >
        <ModalFormWrapper>
          <SettingTabContent
            title='Create team space'
            description='Create a team space in order to invite your teammates'
            backLink={{
              variant: 'icon',
              iconPath: mdiArrowLeft,
              iconSize: 20,
              onClick: () => setShowTeamPersonalForm(false),
            }}
            body={<SettingsTeamForm team={team} teamConversion={true} />}
          />
        </ModalFormWrapper>
      </ModalContainer>
    )
  }

  return (
    <ModalContainer
      left={
        <NavigationBarButton onClick={() => setActiveTab(null)}>
          <Icon size={20} path={mdiArrowLeft} /> Back
        </NavigationBarButton>
      }
      title='Members'
      closeLabel='Done'
    >
      <ModalFormWrapper>
        {team.personal ? (
          <section>
            <Flexbox>
              <h2>Current Members</h2>
              {fetching.has('userEmails') && (
                <Spinner className='relative' style={{ top: 2 }} />
              )}
            </Flexbox>
            <Button
              variant='primary'
              onClick={() => setShowTeamPersonalForm(true)}
            >
              Add members
            </Button>
            <TopMargin />
            <StyledMembersTable>
              <thead className='table-header'>
                <tr>
                  <th>User</th>
                </tr>
              </thead>
              <tbody className='table-body'>
                <tr key={currentUserPermissions.id}>
                  <td>
                    <div className='user-info'>
                      <div className='user-info-icon'>
                        <UserIcon user={currentUserPermissions.user} />
                      </div>
                      <StyledMembername>
                        {currentUserPermissions.user.displayName}
                        {currentUserIsAdmin &&
                          userEmailsMap.has(currentUserPermissions.id) && (
                            <span>
                              {userEmailsMap.get(currentUserPermissions.id)}
                            </span>
                          )}
                      </StyledMembername>
                    </div>
                  </td>
                </tr>
              </tbody>
            </StyledMembersTable>
          </section>
        ) : (
          <>
            <OpenInvitesSection userPermissions={currentUserPermissions} />
            <section>
              <Flexbox>
                <h2>Current Members</h2>
                {fetching.has('userEmails') && (
                  <Spinner className='relative' style={{ top: 2 }} />
                )}
              </Flexbox>
              <StyledMembersTable>
                <thead className='table-header'>
                  <tr>
                    <th>User</th>
                    <th>Access Level</th>
                  </tr>
                </thead>
                <tbody className='table-body'>
                  {permissions.map((permission) => {
                    const targetPermissionsAreUsersOwn =
                      currentUserPermissions.id === permission.id
                    return (
                      <tr key={permission.id}>
                        <td>
                          <div className='user-info'>
                            <div className='user-info-icon'>
                              <UserIcon user={permission.user} />
                            </div>
                            <StyledMembername>
                              {permission.user.displayName}
                              {currentUserIsAdmin &&
                                userEmailsMap.has(permission.id) && (
                                  <span>
                                    {userEmailsMap.get(permission.id)}
                                  </span>
                                )}
                            </StyledMembername>
                          </div>
                        </td>
                        <td>
                          <div className='user-action'>
                            {sending === `${permission.id}-change` ? (
                              <Spinner
                                style={{
                                  position: 'relative',
                                  top: -2,
                                  bottom: 0,
                                  verticalAlign: 'middle',
                                  left: 0,
                                }}
                              />
                            ) : (
                              <SimpleFormSelect
                                className='user--role--select'
                                value={permission.role}
                                onChange={(value: string) =>
                                  changePermissionsRole(
                                    value,
                                    currentUserPermissions,
                                    permission
                                  )
                                }
                                isDisabled={
                                  !currentUserIsAdmin ||
                                  targetPermissionsAreUsersOwn
                                }
                                options={['admin', 'member', 'viewer']}
                              />
                            )}
                            {(targetPermissionsAreUsersOwn ||
                              currentUserIsAdmin) && (
                              <CustomButton
                                variant='transparent'
                                onClick={() => removePermissions(permission)}
                                disabled={sending != null}
                                style={{ width: 80 }}
                              >
                                {sending === `${permission.id}-delete` ? (
                                  <Spinner />
                                ) : currentUserPermissions.id ===
                                  permission.id ? (
                                  'Leave'
                                ) : (
                                  'Remove'
                                )}
                              </CustomButton>
                            )}
                          </div>
                        </td>
                      </tr>
                    )
                  })}
                </tbody>
              </StyledMembersTable>
            </section>{' '}
          </>
        )}
      </ModalFormWrapper>
    </ModalContainer>
  )
}

const TopMargin = styled.div`
  margin-top: ${({ theme }) => theme.space.medium}px;
`

const StyledMembersTable = styled.table`
  width: 100%;
  margin-top: ${({ theme }) => theme.space.default}px;

  .table-header {
    text-align: left;
    border-top: 1px solid ${({ theme }) => theme.subtleBorderColor};

    th {
      padding: ${({ theme }) => theme.space.xsmall}px 0;
      color: ${({ theme }) => theme.subtleTextColor};
      font-size: ${({ theme }) => theme.fontSizes.small}px;
      font-weight: normal;
    }
  }

  .table-body {
    tr {
      border-top: 1px solid ${({ theme }) => theme.subtleBorderColor};

      td {
        &:first-child {
          width: 70%;
        }
        &:last-child {
          width: 30%;
        }
      }
    }

    .user-info,
    .user-action {
      display: flex;
      align-items: center;
      padding: ${({ theme }) => theme.space.xsmall}px 0;
    }

    .user-info-icon {
      margin-right: ${({ theme }) => theme.space.small}px;
    }

    .user-action {
      position: relative;

      .form__select__wrapper {
        flex: 1 0 auto;
      }

      .form__select .form__select__control {
        /* border: transparent; */
      }
    }

    .no-padding {
      padding: 0 !important;
    }
  }
`

const StyledMembername = styled.div`
  display: flex;
  align-items: center;
  flex: 1 1 auto;

  p {
    margin: 0;
    color: ${({ theme }) => theme.baseTextColor};
    padding-right: ${({ theme }) => theme.space.xsmall}px;
  }

  span {
    color: ${({ theme }) => theme.subtleTextColor};
    margin-left: ${({ theme }) => theme.space.xsmall}px;
    font-size: ${({ theme }) => theme.fontSizes.small}px;
    padding: 2px 5px;
  }
`

export default SpaceMembersTab
