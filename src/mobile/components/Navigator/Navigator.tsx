import React, { useMemo, useCallback } from 'react'
import { useRouter, usePathnameWithoutNoteId } from '../../lib/router'
import { useDb } from '../../lib/db'
import { entries } from '../../../lib/db/utils'
import styled from '../../../lib/styled'
import {
  useDialog,
  DialogIconTypes,
  FolderConfigDialogValues,
} from '../../../lib/dialog'
import { useContextMenu, MenuTypes } from '../../../lib/contextMenu'
import { usePreferences } from '../../../lib/preferences'
import {
  sideBarBackgroundColor,
  sideBarDefaultTextColor,
  iconColor,
  sideBarTextColor,
} from '../../../lib/styled/styleFunctions'
import NavigatorItem from './NavigatorItem'
import { useGeneralStatus } from '../../lib/generalStatus'
import ControlButton from './ControlButton'
import FolderListFragment from './FolderListFragment'
import TagListFragment from './TagListFragment'
import { useUsers } from '../../../lib/accounts'
import { useToast } from '../../../lib/toast'
import { useTranslation } from 'react-i18next'
import {
  IconAddRound,
  IconAdjustVertical,
  IconArrowAgain,
  IconTrash,
  // IconImage,
  IconSetting,
  IconBook,
  // IconStarActive
} from '../../../components/icons'
import Icon from '../atoms/Icon'
import { mdiClose } from '@mdi/js'

const Description = styled.nav`
  margin-left: 15px;
  margin-bottom: 10px;
  font-size: 18px;
  ${sideBarDefaultTextColor}
`

const StyledSideNavContainer = styled.nav`
  display: flex;
  flex-direction: column;
  height: 100%;
  ${sideBarBackgroundColor}
  .topControl {
    height: 50px;
    display: flex;
    -webkit-app-region: drag;
    .spacer {
      flex: 1;
    }
    .button {
      width: 50px;
      height: 50px;
      background-color: transparent;
      border: none;
      cursor: pointer;
      font-size: 24px;
      ${iconColor}
    }
  }

  .storageList {
    list-style: none;
    padding: 0;
    margin: 0;
    flex: 1;
    overflow: auto;
    display: flex;
    flex-direction: column;
  }

  .empty {
    padding: 4px;
    padding-left: 26px;
    margin-bottom: 4px;
    ${sideBarTextColor}
    user-select: none;
  }

  .bottomControl {
    height: 35px;
    display: flex;
    border-top: 1px solid ${({ theme }) => theme.colors.border};
    button {
      height: 35px;
      border: none;
      background-color: transparent;
      display: flex;
      align-items: center;
    }
    .addFolderButton {
      flex: 1;
      border-right: 1px solid ${({ theme }) => theme.colors.border};
    }
    .addFolderButtonIcon {
      margin-right: 4px;
    }
    .moreButton {
      width: 30px;
      display: flex;
      justify-content: center;
    }
  }
`

const CreateStorageButton = styled.button`
  position: absolute;
  right: 8px;
  border: none;
  background-color: transparent;
  cursor: pointer;
  ${iconColor}
`

const Spacer = styled.div`
  flex: 1;
`

interface NavigatorProps {
  toggle: () => void
}

export default ({ toggle }: NavigatorProps) => {
  const {
    createStorage,
    createFolder,
    renameFolder,
    renameStorage,
    removeStorage,
    changeFolderColor,
    storageMap,
    syncStorage,
  } = useDb()
  const { popup } = useContextMenu()
  const { prompt, messageBox, folderConfig } = useDialog()
  const { push } = useRouter()
  const [[user]] = useUsers()
  const { pushMessage } = useToast()

  const storageEntries = useMemo(() => {
    return entries(storageMap)
  }, [storageMap])

  const openSideNavContextMenu = useCallback(
    (event: React.MouseEvent) => {
      event.preventDefault()
      popup(event, [
        {
          type: MenuTypes.Normal,
          label: 'New Storage',
          onClick: async () => {
            prompt({
              title: 'Create a Storage',
              message: 'Enter name of a storage to create',
              iconType: DialogIconTypes.Question,
              submitButtonLabel: 'Create Storage',
              onClose: async (value: string | null) => {
                if (value == null) return
                const storage = await createStorage(value)
                push(`/m/storages/${storage.id}/notes`)
              },
            })
          },
        },
      ])
    },
    [popup, prompt, createStorage, push]
  )

  const { toggleClosed } = usePreferences()
  const {
    toggleSideNavOpenedItem,
    sideNavOpenedItemSet,
    openSideNavFolderItemRecursively,
    toggleNav,
  } = useGeneralStatus()

  const currentPathname = usePathnameWithoutNoteId()

  const { t } = useTranslation()

  return (
    <StyledSideNavContainer>
      <div className='topControl'>
        <button className='button' onClick={toggle}>
          <Icon path={mdiClose} />
        </button>
        <div className='spacer' />
        <button className='button' onClick={toggleClosed}>
          <IconAdjustVertical size='0.8em' />
        </button>
      </div>

      {/* <NavigatorItem
        icon={<IconStarActive />}
        depth={0}
        className='bookmark-sidenav'
        label='Bookmarks'
        active={currentPathname === `/app/bookmarks`}
        onClick={() => {
          push(`/app/bookmarks`)
          toggle()
        }}
      /> */}

      <Description>
        Storages
        <CreateStorageButton
          onClick={() => {
            push('/m/storages')
            toggleNav()
          }}
        >
          <IconAddRound size='1.7em' />
        </CreateStorageButton>
      </Description>

      <div className='storageList'>
        {storageEntries.map(([, storage]) => {
          const itemId = `storage:${storage.id}`
          const storageIsFolded = !sideNavOpenedItemSet.has(itemId)
          const showPromptToCreateFolder = (folderPathname: string) => {
            folderConfig({
              title: 'Create a Folder',
              message: 'Enter the path where do you want to create a folder',
              iconType: DialogIconTypes.Question,
              defaultValue: {
                folderPath: folderPathname === '/' ? '/' : `${folderPathname}/`,
                color: '',
              },
              submitButtonLabel: 'Create Folder',
              onClose: async (value: FolderConfigDialogValues | null) => {
                if (value === null || value.folderPath === undefined) {
                  return
                }
                if (value.folderPath.endsWith('/')) {
                  value.folderPath = value.folderPath.slice(
                    0,
                    value.folderPath.length - 1
                  )
                }
                await createFolder(storage.id, value.folderPath, value.color)

                push(`/m/storages/${storage.id}/notes${value.folderPath}`)

                // Open folder item
                openSideNavFolderItemRecursively(storage.id, value.folderPath)
              },
            })
          }
          const showPromptToRenameFolder = (folderPathname: string) => {
            prompt({
              title: t('folder.rename'),
              message: t('folder.renameMessage'),
              iconType: DialogIconTypes.Question,
              defaultValue: folderPathname.split('/').pop(),
              submitButtonLabel: t('folder.rename'),
              onClose: async (value: string | null) => {
                const folderPathSplit = folderPathname.split('/')
                if (
                  value == null ||
                  value === '' ||
                  value === folderPathSplit.pop()
                ) {
                  return
                }
                const newPathname = folderPathSplit.join('/') + '/' + value
                try {
                  await renameFolder(storage.id, folderPathname, newPathname)
                  push(`/m/storages/${storage.id}/notes${newPathname}`)
                  openSideNavFolderItemRecursively(storage.id, newPathname)
                } catch (error) {
                  pushMessage({
                    title: t('general.error'),
                    description: t('folder.renameErrorMessage'),
                  })
                }
              },
            })
          }
          const showFormToChangeFolderColor = (
            folderPathname: string,
            folderColor?: string
          ) => {
            folderConfig({
              title: 'Change Folder Color',
              message: 'Select the color of your folder',
              iconType: DialogIconTypes.Question,
              defaultValue: {
                color: folderColor || '',
              },
              submitButtonLabel: 'Change Color',
              onClose: async (value: FolderConfigDialogValues | null) => {
                if (value === null) {
                  return
                }
                await changeFolderColor(storage.id, folderPathname, value.color)
              },
            })
          }

          const allNotesPagePathname = `/m/storages/${storage.id}/notes`
          const allNotesPageIsActive = currentPathname === allNotesPagePathname

          const trashcanPagePathname = `/m/storages/${storage.id}/trashcan`
          const trashcanPageIsActive = currentPathname === trashcanPagePathname

          // const attachmentsPagePathname = `/m/storages/${storage.id}/attachments`
          // const attachmentsPageIsActive =
          //   currentPathname === attachmentsPagePathname

          const controlComponents = [
            <ControlButton
              key={`${storage.id}-addFolderButton`}
              onClick={() => showPromptToCreateFolder('/')}
              icon={<IconAddRound />}
            />,
          ]

          if (storage.cloudStorage != null && user != null) {
            const cloudSync = () => {
              if (user == null) {
                pushMessage({
                  title: 'No User Error',
                  description: 'Please login first to sync the storage.',
                })
              }
              syncStorage(storage.id)
            }

            controlComponents.unshift(
              <ControlButton
                key={`${storage.id}-syncButton`}
                onClick={cloudSync}
                icon={<IconArrowAgain />}
              />
            )
          }

          controlComponents.unshift(
            <ControlButton
              key={`${storage.id}-settingsButton`}
              onClick={() => {
                push(`/m/storages/${storage.id}`)
                toggleNav()
              }}
              icon={<IconSetting size='1.3em' />}
            />
          )

          return (
            <React.Fragment key={itemId}>
              <NavigatorItem
                depth={0}
                label={storage.name}
                folded={storageIsFolded}
                onFoldButtonClick={() => {
                  toggleSideNavOpenedItem(itemId)
                }}
                onClick={() => {
                  toggleSideNavOpenedItem(itemId)
                }}
                onContextMenu={(event) => {
                  event.preventDefault()
                  popup(event, [
                    {
                      type: MenuTypes.Normal,
                      label: t('storage.rename'),
                      onClick: async () => {
                        prompt({
                          title: `Rename "${storage.name}" storage`,
                          message: t('storage.renameMessage'),
                          iconType: DialogIconTypes.Question,
                          defaultValue: storage.name,
                          submitButtonLabel: t('storage.rename'),
                          onClose: async (value: string | null) => {
                            if (value == null) return
                            await renameStorage(storage.id, value)
                          },
                        })
                      },
                    },
                    {
                      type: MenuTypes.Normal,
                      label: t('storage.remove'),
                      onClick: async () => {
                        messageBox({
                          title: `Remove "${storage.name}" storage`,
                          message: t('storage.removeMessage'),
                          iconType: DialogIconTypes.Warning,
                          buttons: [t('storage.remove'), t('general.cancel')],
                          defaultButtonIndex: 0,
                          cancelButtonIndex: 1,
                          onClose: (value: number | null) => {
                            if (value === 0) {
                              removeStorage(storage.id)
                            }
                          },
                        })
                      },
                    },
                  ])
                }}
                controlComponents={controlComponents}
              />
              {!storageIsFolded && (
                <>
                  <NavigatorItem
                    depth={1}
                    label='All Notes'
                    icon={<IconBook size='1em' />}
                    active={allNotesPageIsActive}
                    onClick={() => {
                      push(allNotesPagePathname)
                      toggleNav()
                    }}
                  />
                  <FolderListFragment
                    storage={storage}
                    showPromptToCreateFolder={showPromptToCreateFolder}
                    showPromptToRenameFolder={showPromptToRenameFolder}
                    showFormToChangeFolderColor={showFormToChangeFolderColor}
                  />
                  <TagListFragment storage={storage} />
                  {/* <NavigatorItem
                    depth={1}
                    label={t('general.attachments')}
                    icon={<IconImage size='1.5em' />}
                    active={attachmentsPageIsActive}
                    onClick={() => {
                      push(attachmentsPagePathname)
                      toggleNav()
                    }}
                    onContextMenu={event => {
                      event.preventDefault()
                    }}
                  /> */}
                  <NavigatorItem
                    depth={1}
                    label={t('general.trash')}
                    icon={trashcanPageIsActive ? <IconTrash /> : <IconTrash />}
                    active={trashcanPageIsActive}
                    onClick={() => {
                      push(trashcanPagePathname)
                      toggleNav()
                    }}
                    onContextMenu={(event) => {
                      event.preventDefault()
                      // TODO: Implement context menu(restore all notes)
                    }}
                  />
                </>
              )}
            </React.Fragment>
          )
        })}
        {storageEntries.length === 0 && (
          <div className='empty'>{t('storage.noStorage')}</div>
        )}

        <Spacer onContextMenu={openSideNavContextMenu} />
      </div>
    </StyledSideNavContainer>
  )
}
