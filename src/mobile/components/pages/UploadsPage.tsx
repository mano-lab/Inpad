import React, { useState, useCallback } from 'react'
import {
  getUploadsListPageData,
  UploadsListPageResponseBody,
} from '../../../cloud/api/pages/teams/uploads'
import FileListItem from '../../../cloud/components/atoms/FileListItem'
import styled from '../../../cloud/lib/styled'
import cc from 'classcat'
import { SerializedTeam } from '../../../cloud/interfaces/db/team'
import { DialogIconTypes, useDialog } from '../../../shared/lib/stores/dialog'
import { useToast } from '../../../shared/lib/stores/toast'
import { deleteFile } from '../../../cloud/api/teams/files'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { useSettings } from '../../../cloud/lib/stores/settings'
import { SerializedFileInfo } from '../../../cloud/interfaces/db/storage'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import {
  freePlanStorageMb,
  proPlanStorageMb,
  standardPlanStorageMb,
} from '../../../cloud/lib/subscription'
import AppLayout from '../layouts/AppLayout'

const UploadListPage = ({
  files,
  team,
  sizeInMb,
}: UploadsListPageResponseBody) => {
  const [currentFiles, setCurrentFiles] = useState(files)
  const [sending, setSending] = useState<boolean>(false)
  const { messageBox } = useDialog()
  const { pushApiErrorMessage } = useToast()
  const { subscription, permissions, currentUserIsCoreMember } = usePage()
  const { openSettingsTab } = useSettings()

  const onDeleteHandler = useCallback(
    (team: SerializedTeam, file: SerializedFileInfo) => {
      if (sending) {
        return
      }

      setSending(true)

      messageBox({
        title: `Cancel?`,
        message: `Are you sure to delete this file? It won't be visible in your document anymore.`,
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
              deleteFile(team, file.name)
                .then(() => {
                  setCurrentFiles((prev) => {
                    return prev.filter((item) => item.name !== file.name)
                  })
                })
                .catch((error: any) => {
                  pushApiErrorMessage(error)
                })
                .finally(() => setSending(false))
            },
          },
        ],
      })
    },
    [messageBox, setCurrentFiles, pushApiErrorMessage, sending]
  )

  return (
    <AppLayout title='Attachments'>
      {permissions != null && (
        <StorageDescription>
          <span>
            {sizeInMb}MB of{' '}
            {subscription == null
              ? `${freePlanStorageMb}MB `
              : subscription.plan === 'standard'
              ? `${(permissions.length * standardPlanStorageMb) / 1000}GB `
              : `${(permissions.length * proPlanStorageMb) / 1000}GB `}
            used.{' '}
          </span>
          {(subscription == null || subscription.plan !== 'pro') && (
            <span>
              If you need more space, please{' '}
              <a
                className='upgrade-link'
                href='#'
                onClick={(e: any) => {
                  e.preventDefault()
                  openSettingsTab('teamUpgrade')
                }}
              >
                upgrade your plan.
              </a>
            </span>
          )}
        </StorageDescription>
      )}
      <FileItemList>
        {currentFiles.length > 0 &&
          currentFiles.map((file, i) => (
            <FileListItem
              file={file}
              team={team}
              key={`file-${i}`}
              className={cc([i % 3 == 2 && 'last', sending && 'disabled'])}
              onDeleteHandler={
                currentUserIsCoreMember ? onDeleteHandler : undefined
              }
            />
          ))}
      </FileItemList>
    </AppLayout>
  )
}

UploadListPage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getUploadsListPageData(params)
  return result
}

export default UploadListPage

const StorageDescription = styled.div`
  margin-bottom: ${({ theme }) => theme.space.default}px;

  span {
    color: ${({ theme }) => theme.baseTextColor};
  }
  a {
    color: ${({ theme }) => theme.primaryTextColor};

    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.emphasizedBackgroundColor};
      text-decoration: none;
    }
  }
`

const FileItemList = styled.ul`
  margin: 0;
  padding: 0;
  vertical-align: middle;

  .file-list-item {
    position: relative;
    display: inline-block;
    margin-bottom: ${({ theme }) => theme.space.small}px;
    width: 32%;
    border: 1px solid ${({ theme }) => theme.baseBorderColor};
    border-radius: 5px;
    padding: 10px 15px;
    height: 250px;
    vertical-align: middle;

    &.disabled {
      .delete-icon {
        pointer-events: none;
        opacity: 0.3;
      }
    }

    .wrapper {
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
    }

    .delete-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      position: absolute;
      top: ${({ theme }) => theme.space.xxsmall}px;
      right: ${({ theme }) => theme.space.xxsmall}px;
      background: ${({ theme }) => theme.subtleBackgroundColor};
      text-align: center;
      border-radius: 5px;
      width: 30px;
      height: 30px;
      cursor: pointer;
      svg {
        color: ${({ theme }) => theme.subtleTextColor};
      }
      &:hover,
      &:focus {
        svg {
          color: ${({ theme }) => theme.baseTextColor};
        }
      }
    }

    :not(.last) {
      margin-right: 1%;
    }

    img {
      width: 100%;
      max-height: 210px;
      display: block;
      margin: auto;
      object-fit: contain;
    }

    .date {
      font-size: ${({ theme }) => theme.fontSizes.small}px;
      color: ${({ theme }) => theme.subtleTextColor};
    }
  }
`
