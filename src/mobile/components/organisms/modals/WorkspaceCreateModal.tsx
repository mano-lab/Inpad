import React, { useState, useCallback, useRef } from 'react'
import ModalContainer from './atoms/ModalContainer'
import ModalFormWrapper from './atoms/ModalFormWrapper'

import { usePage } from '../../../../cloud/lib/stores/pageStore'

import { Spinner } from '../../../../cloud/components/atoms/Spinner'
import ErrorBlock from '../../../../cloud/components/atoms/ErrorBlock'
import { useGlobalData } from '../../../../cloud/lib/stores/globalData'
import { SerializedUserTeamPermissions } from '../../../../cloud/interfaces/db/userTeamPermissions'
import {
  CreateWorkspaceRequestBody,
  createWorkspace,
} from '../../../../cloud/api/teams/workspaces'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import { useNav } from '../../../../cloud/lib/stores/nav'
import Flexbox from '../../../../cloud/components/atoms/Flexbox'
import { useModal } from '../../../../shared/lib/stores/modal'
import Switch from '../../../../shared/components/atoms/Switch'
import Button from '../../../../shared/components/atoms/Button'
import {
  ModaLineHeader,
  ModalLine,
} from '../../../../cloud/components/organisms/Modal/contents/styled'
import WorkspaceAccess from '../../../../cloud/components/organisms/Modal/contents/Workspace/WorkspaceAccess'
import {
  StyledModalForm,
  StyledModalFormInput,
} from '../../../../cloud/components/organisms/Modal/contents/Forms/styled'
import { useEffectOnce } from 'react-use'

const WorkspaceCreateModal = () => {
  const { team, permissions } = usePage()
  const {
    globalData: { currentUser },
  } = useGlobalData()
  const { closeLastModal } = useModal()
  const { updateWorkspacesMap } = useNav()

  const [error, setError] = useState<unknown>()
  const [sending, setSending] = useState<boolean>(false)
  const [name, setName] = useState<string>('')
  const [isPublic, setIsPublic] = useState<boolean>(true)
  const [selectedPermissions, setSelectedPermissions] = useState<
    SerializedUserTeamPermissions[]
  >([])

  const togglePrivate = useCallback(() => {
    setIsPublic((prev) => {
      if (prev) {
        setSelectedPermissions([])
      }
      return !prev
    })
  }, [])

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
          throw new Error('Workspace name has to be filled.')
        }

        await submitCreateWorkSpaceHandler(team, body)
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
      selectedPermissions,
      submitCreateWorkSpaceHandler,
      team,
      isPublic,
    ]
  )

  const nameInputRef = useRef<HTMLInputElement>(null)

  useEffectOnce(() => {
    if (nameInputRef.current == null) {
      return
    }

    nameInputRef.current.focus()
  })

  if (currentUser == null) {
    return (
      <ModalContainer title='Create a workspace' closeLabel='Cancel'>
        <ModalFormWrapper>You need to be connected.</ModalFormWrapper>
      </ModalContainer>
    )
  }

  if (team == null) {
    return (
      <ModalContainer title='Create a workspace' closeLabel='Cancel'>
        <ModalFormWrapper>You need to select a valid team.</ModalFormWrapper>
      </ModalContainer>
    )
  }

  return (
    <ModalContainer title='Create a workspace' closeLabel='Cancel'>
      <ModalFormWrapper>
        <StyledModalForm onSubmit={onSubmit}>
          <ModalLine>
            <ModaLineHeader>Name</ModaLineHeader>
          </ModalLine>
          <ModalLine className='svg-initial-style' style={{ marginBottom: 30 }}>
            <StyledModalFormInput
              ref={nameInputRef}
              placeholder='Workspace name'
              value={name}
              onChange={onChangeWorkspaceNameHandler}
            />
          </ModalLine>
          <ModalLine>
            <ModaLineHeader>Make private</ModaLineHeader>
          </ModalLine>
          <ModalLine style={{ marginBottom: 30 }}>
            <Flexbox justifyContent='space-between'>
              {isPublic ? (
                <span>
                  This workspace is public. Anyone from the team can access it
                </span>
              ) : (
                <span>
                  This workspace is private. You can set individual member
                  access below.
                </span>
              )}
              <Flexbox flex='0 0 auto'>
                <Switch
                  disabled={sending}
                  id='make-private-switch'
                  onChange={togglePrivate}
                  checked={!isPublic}
                />
              </Flexbox>
            </Flexbox>
          </ModalLine>{' '}
          {!isPublic && (
            <WorkspaceAccess
              permissions={permissions}
              selectedPermissions={selectedPermissions}
              setSelectedPermissions={setSelectedPermissions}
              currentUser={currentUser}
            />
          )}
          {error != null && (
            <ModalLine>
              <ErrorBlock
                error={error}
                style={{ margin: 0, width: '100%', marginTop: 20 }}
              />
            </ModalLine>
          )}
          <ModalLine className='justify-center svg-initial-style'>
            <Button variant='primary' type='submit' disabled={sending}>
              {sending ? (
                <Spinner size={16} style={{ fontSize: 16, marginRight: 0 }} />
              ) : (
                'Create'
              )}
            </Button>
          </ModalLine>
        </StyledModalForm>
      </ModalFormWrapper>
    </ModalContainer>
  )
}

export default WorkspaceCreateModal
