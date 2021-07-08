import React, { useState, useCallback, useMemo } from 'react'
import styled from '../../../../shared/lib/styled'
import { useNav } from '../../../../cloud/lib/stores/nav'
import { SerializedWorkspace } from '../../../../cloud/interfaces/db/workspace'
import { sortByAttributeAsc } from '../../../../cloud/lib/utils/array'
import { useModal } from '../../../../shared/lib/stores/modal'
import Button from '../../../../shared/components/atoms/Button'
import { useI18n } from '../../../../cloud/lib/hooks/useI18n'
import { lngKeys } from '../../../../cloud/lib/i18n/types'
import ModalContainer from './atoms/ModalContainer'
import WorkspaceExplorer from '../../../../cloud/components/molecules/WorkspaceExplorer'
import MobileFormControl from '../../atoms/MobileFormControl'

interface MobileResourceMoveModalProps {
  onSubmit: (workspaceId: string, parentFolderId?: string) => void
}

const MobileResourceMoveModal = ({
  onSubmit,
}: MobileResourceMoveModalProps) => {
  const { closeLastModal: closeModal } = useModal()
  const [selectedWorkspaceId, setSelectedWorkspaceId] = useState<string>()
  const [selectedFolderId, setSelectedFolderId] = useState<string>()
  const { workspacesMap, foldersMap } = useNav()
  const { translate } = useI18n()

  const sortedWorkspaces = useMemo(() => {
    const workspaces = [...workspacesMap.values()]
    const {
      public: publicWorkspaces,
      private: privateWorkspaces,
    } = workspaces.reduce<{
      public: SerializedWorkspace[]
      private: SerializedWorkspace[]
    }>(
      (acc, workspace) => {
        if (workspace.public) {
          acc.public.push(workspace)
        } else {
          acc.private.push(workspace)
        }
        return acc
      },
      { public: [], private: [] }
    )

    return [
      ...sortByAttributeAsc('name', publicWorkspaces),
      ...sortByAttributeAsc('name', privateWorkspaces),
    ]
  }, [workspacesMap])

  const sortedFolders = useMemo(() => {
    return sortByAttributeAsc('name', [...foldersMap.values()])
  }, [foldersMap])

  const onSubmitForm = useCallback(
    async (event: React.FormEvent) => {
      event.preventDefault()
      if (selectedWorkspaceId == null) {
        closeModal()
        return
      }

      onSubmit(selectedWorkspaceId, selectedFolderId)

      closeModal()
    },
    [onSubmit, selectedWorkspaceId, selectedFolderId, closeModal]
  )

  return (
    <ModalContainer title='Move Resources'>
      <Container className='body'>
        <form
          className='body__form'
          onSubmit={onSubmitForm}
          style={{ height: '100%', margin: 0 }}
        >
          <h3>{translate(lngKeys.GeneralPickYourDestination)}</h3>

          <div className='body__form__explorer'>
            <WorkspaceExplorer
              folders={sortedFolders}
              workspaces={sortedWorkspaces}
              selectedWorkspaceId={selectedWorkspaceId}
              selectedFolderId={selectedFolderId}
              setSelectedFolderId={setSelectedFolderId}
              setSelectedWorkspaceId={setSelectedWorkspaceId}
            />
          </div>
          <MobileFormControl>
            <Button
              variant='primary'
              type='submit'
              disabled={selectedWorkspaceId == null}
            >
              {translate(lngKeys.GeneralMoveVerb)}
            </Button>
          </MobileFormControl>
        </form>
      </Container>
    </ModalContainer>
  )
}

export default MobileResourceMoveModal

const Container = styled.form`
  padding: ${({ theme }) => theme.sizes.spaces.md}px;

  .body__form__explorer {
    margin-bottom: ${({ theme }) => theme.sizes.spaces.df}px;
  }
`
