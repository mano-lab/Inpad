import React, { useState, useCallback, useMemo, useRef } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import ErrorBlock from '../../../../cloud/components/atoms/ErrorBlock'
import { SerializedWorkspace } from '../../../../cloud/interfaces/db/workspace'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import { SerializedUserTeamPermissions } from '../../../../cloud/interfaces/db/userTeamPermissions'
import {
  CreateWorkspaceRequestBody,
  createWorkspace,
  UpdateWorkspaceRequestBody,
  updateWorkspace,
} from '../../../../cloud/api/teams/workspaces'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { useToast } from '../../../../shared/lib/stores/toast'
import { useModal } from '../../../../shared/lib/stores/modal'
import { LoadingButton } from '../../../../shared/components/atoms/Button'
import Form from '../../../../shared/components/molecules/Form'
import FormRow from '../../../../shared/components/molecules/Form/templates/FormRow'
import { useEffectOnce } from 'react-use'
import { lngKeys } from '../../../../cloud/lib/i18n/types'
import { useI18n } from '../../../../cloud/lib/hooks/useI18n'
import WorkspaceAccess from '../../../../cloud/components/organisms/Modal/contents/Workspace/WorkspaceAccess'
import ModalContainer from './atoms/ModalContainer'
import ModalFormWrapper from './atoms/ModalFormWrapper'
import MobileFormControl from '../../atoms/MobileFormControl'

interface MobileWorkspaceModalProps {
  title: string
  workspace?: SerializedWorkspace
}

const MobileWorkspaceModal = ({
  title,
  workspace,
}: MobileWorkspaceModalProps) => {
  const { team, permissions } = usePage()
  const {
    globalData: { currentUser },
  } = useGlobalData()
  const { pushMessage } = useToast()
  const { closeLastModal } = useModal()
  const { updateWorkspacesMap } = useNav()
  const inputRef = useRef<HTMLInputElement>(null)

  const [error, setError] = useState<unknown>()
  const [sending, setSending] = useState<boolean>(false)
  const [name, setName] = useState<string>(
    workspace != null ? workspace.name : ''
  )
  const [isPublic, setIsPublic] = useState<boolean>(
    workspace != null ? workspace.public : true
  )
  const [selectedPermissions, setSelectedPermissions] = useState<
    SerializedUserTeamPermissions[]
  >(
    workspace != null && workspace.permissions != null && permissions != null
      ? permissions.filter((permission) =>
          workspace.permissions!.map((p) => p.id).includes(permission.id)
        )
      : []
  )
  const { translate } = useI18n()

  useEffectOnce(() => {
    if (inputRef.current != null) {
      inputRef.current.focus()
    }
  })

  const togglePrivate = useCallback(() => {
    setIsPublic((prev) => {
      if (prev) {
        setSelectedPermissions([])
      }
      return !prev
    })
  }, [])

  const ownerPermissions = useMemo(() => {
    if (workspace == null) {
      return undefined
    }

    if (workspace.ownerId == null || permissions == null) {
      return undefined
    }

    return permissions.find((p) => p.id === workspace.ownerId)
  }, [workspace, permissions])

  const isOwner = useMemo(() => {
    if (currentUser == null) {
      return false
    }

    if (workspace == null || workspace.ownerId == null || permissions == null) {
      return true
    }
    if (ownerPermissions == null) {
      return true
    }

    return currentUser.id === ownerPermissions.user.id
  }, [permissions, currentUser, workspace, ownerPermissions])

  const onChangeWorkspaceNameHandler = useCallback(
    (event: React.ChangeEvent<HTMLInputElement>) => {
      setName(event.target.value)
    },
    [setName]
  )

  const submitCreateWorkSpaceHandler = useCallback(
    async (team: SerializedTeam, body: CreateWorkspaceRequestBody) => {
      const { workspace } = await createWorkspace(team, body)
      updateWorkspacesMap([workspace.id, workspace])
    },
    [updateWorkspacesMap]
  )

  const submitEditWorkSpaceHandler = useCallback(
    async (
      team: SerializedTeam,
      workspace: SerializedWorkspace,
      body: UpdateWorkspaceRequestBody
    ) => {
      const { workspace: updatedWorkspace } = await updateWorkspace(
        team,
        workspace.id,
        body
      )
      updateWorkspacesMap([workspace.id, updatedWorkspace])
    },
    [updateWorkspacesMap]
  )

  const onSubmit = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (team == null) {
        return
      }

      const body = {
        name,
        public: isPublic,
        permissions:
          !isPublic && selectedPermissions != null
            ? selectedPermissions.map((p) => p.id)
            : [],
      }

      setError(undefined)
      setSending(true)
      try {
        if (body.name.trim() === '') {
          throw new Error('Folder name has to be filled.')
        }
        if (workspace != null) {
          await submitEditWorkSpaceHandler(team, workspace, body)
          pushMessage({
            title: 'Success',
            description: 'Your folder has been updated',
            type: 'success',
          })
        } else {
          await submitCreateWorkSpaceHandler(team, body)
        }
        closeLastModal()
      } catch (error) {
        setError(error)
      } finally {
        setSending(false)
      }
    },
    [
      name,
      closeLastModal,
      pushMessage,
      selectedPermissions,
      submitCreateWorkSpaceHandler,
      submitEditWorkSpaceHandler,
      team,
      isPublic,
      workspace,
    ]
  )

  if (currentUser == null) {
    return (
      <ModalContainer title={title}>
        <p>You need to be connected.</p>
      </ModalContainer>
    )
  }

  if (team == null) {
    return (
      <ModalContainer title={title}>
        <p>You need to select a valid team.</p>
      </ModalContainer>
    )
  }

  return (
    <ModalContainer title={title}>
      <ModalFormWrapper>
        <Form onSubmit={onSubmit} fullWidth={true}>
          <MobileFormControl>
            <FormRow
              fullWidth={true}
              row={{
                title: translate(lngKeys.GeneralName),
                items: [
                  {
                    type: 'input',
                    props: {
                      ref: inputRef,
                      placeholder: translate(lngKeys.GeneralName),
                      value: name,
                      onChange: onChangeWorkspaceNameHandler,
                    },
                  },
                ],
              }}
            />
          </MobileFormControl>
          <MobileFormControl>
            {workspace != null && workspace.default ? (
              <FormRow
                row={{
                  title: translate(lngKeys.ModalsWorkspaceAccess),
                  description: translate(
                    lngKeys.ModalsWorkspaceDefaultDisclaimer
                  ),
                }}
              />
            ) : (
              <FormRow
                row={{
                  title: translate(lngKeys.ModalsWorkspaceMakePrivate),
                  items: [
                    {
                      type: 'node',
                      element: (
                        <small>
                          {isPublic
                            ? translate(lngKeys.ModalsWorkspacePublicDisclaimer)
                            : `${translate(
                                lngKeys.ModalsWorkspacePrivateDisclaimer
                              )} ${
                                isOwner != null
                                  ? translate(
                                      lngKeys.ModalsWorkspacePrivateOwner
                                    )
                                  : ''
                              }`}
                        </small>
                      ),
                    },
                    {
                      type: 'switch',
                      props: {
                        disabled:
                          sending ||
                          (workspace != null && workspace.default) ||
                          !isOwner,
                        id: 'make-private-switch',
                        onChange: togglePrivate,
                        checked: !isPublic,
                      },
                    },
                  ],
                }}
              />
            )}
          </MobileFormControl>

          {!isOwner && (
            <MobileFormControl>
              <small>
                {translate(lngKeys.ModalsWorkspacesNonOwnerDisclaimer)}
              </small>
            </MobileFormControl>
          )}

          {!isPublic && (
            <MobileFormControl>
              <WorkspaceAccess
                permissions={permissions}
                ownerPermissions={ownerPermissions}
                currentUserIsOwner={isOwner}
                selectedPermissions={selectedPermissions}
                setSelectedPermissions={setSelectedPermissions}
                currentUser={currentUser}
              />
            </MobileFormControl>
          )}

          {error != null && (
            <div className='form__row'>
              <ErrorBlock error={error} style={{ margin: 0, width: '100%' }} />
            </div>
          )}

          <MobileFormControl>
            <LoadingButton
              spinning={sending}
              variant='primary'
              type='submit'
              disabled={sending}
            >
              {workspace != null
                ? translate(lngKeys.GeneralUpdateVerb)
                : translate(lngKeys.GeneralCreate)}
            </LoadingButton>
          </MobileFormControl>
        </Form>
      </ModalFormWrapper>
    </ModalContainer>
  )
}

export default MobileWorkspaceModal
