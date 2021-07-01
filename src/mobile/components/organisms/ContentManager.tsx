import React, {
  useState,
  useMemo,
  useCallback,
  useEffect,
  useRef,
  FocusEvent,
} from 'react'
import {
  SerializedDocWithBookmark,
  DocStatus,
} from '../../../cloud/interfaces/db/doc'
import { SerializedFolderWithBookmark } from '../../../cloud/interfaces/db/folder'
import { useSet } from 'react-use'
import {
  sortByAttributeAsc,
  sortByAttributeDesc,
} from '../../../cloud/lib/utils/array'
import {
  getDocTitle,
  getDocId,
  getFolderId,
} from '../../../cloud/lib/utils/patterns'
import { SerializedWorkspace } from '../../../cloud/interfaces/db/workspace'
import { StyledContentManagerList } from '../../../cloud/components/molecules/ContentManager/styled'
import Checkbox from '../../../cloud/components/atoms/Checkbox'
import { SerializedTeam } from '../../../cloud/interfaces/db/team'
import { CustomSelectOption } from '../../../cloud/components/atoms/Select/CustomSelect'
import SortingOption, {
  sortingOrders,
} from '../../../cloud/components/molecules/ContentManager/SortingOption'
import ContentManagerDocRow from '../../../cloud/components/molecules/ContentManager/Rows/ContentManagerDocRow'
import ContentmanagerFolderRow from '../../../cloud/components/molecules/ContentManager/Rows/ContentManagerFolderRow'
import { difference } from 'ramda'
import ContentManagerBulkActions from '../../../cloud/components/molecules/ContentManager/Actions/ContentManagerBulkActions'
import {
  mdiFilePlusOutline,
  mdiFolderPlusOutline,
  mdiFormatListChecks,
} from '@mdi/js'
import Button, { LoadingButton } from '../../../shared/components/atoms/Button'
import styled from '../../../shared/lib/styled'
import DocStatusIcon from '../../../cloud/components/atoms/DocStatusIcon'
import { isChildNode } from '../../../shared/lib/dom'
import { usePreferences } from '../../lib/preferences'
import EmptyRow from '../../../cloud/components/molecules/ContentManager/Rows/EmptyRow'
import cc from 'classcat'
import { useCloudResourceModals } from '../../../cloud/lib/hooks/useCloudResourceModals'

export type ContentManagerParent =
  | { type: 'folder'; item: SerializedFolderWithBookmark }
  | { type: 'workspace'; item: SerializedWorkspace }

interface ContentManagerProps {
  team: SerializedTeam
  documents: SerializedDocWithBookmark[]
  folders: SerializedFolderWithBookmark[]
  workspacesMap: Map<string, SerializedWorkspace>
  currentUserIsCoreMember: boolean
  currentWorkspaceId?: string
  currentFolderId?: string
  showCreateButtons?: boolean
  page?: 'archive' | 'tag' | 'shared'
}

const ContentManager = ({
  team,
  documents,
  folders,
  page,
  workspacesMap,
  currentFolderId,
  currentWorkspaceId,
  currentUserIsCoreMember,
  showCreateButtons = currentUserIsCoreMember ? true : false,
}: ContentManagerProps) => {
  const { preferences, setPreferences } = usePreferences()
  const [sendingAction, setSendingAction] = useState<
    'new-doc' | 'new-folder' | undefined
  >()
  const { openNewDocForm, openNewFolderForm } = useCloudResourceModals()
  const [order, setOrder] = useState<typeof sortingOrders[number]['data']>(
    preferences.folderSortingOrder
  )

  const [
    selectedFolderSet,
    {
      add: addFolder,
      has: hasFolder,
      toggle: toggleFolder,
      reset: resetFolders,
      remove: removeFolder,
    },
  ] = useSet<string>(new Set())
  const [
    selectedDocSet,
    {
      add: addDoc,
      has: hasDoc,
      toggle: toggleDoc,
      remove: removeDoc,
      reset: resetDocs,
    },
  ] = useSet<string>(new Set())

  const currentDocumentsRef = useRef(
    new Map<string, SerializedDocWithBookmark>(
      documents.map((doc) => [doc.id, doc])
    )
  )
  const currentFoldersRef = useRef(
    new Map<string, SerializedFolderWithBookmark>(
      folders.map((folder) => [folder.id, folder])
    )
  )
  const [updating, setUpdating] = useState<string[]>([])

  useEffect(() => {
    const newMap = new Map(documents.map((doc) => [doc.id, doc]))
    const idsToClean: string[] = difference(
      [...currentDocumentsRef.current.keys()],
      [...newMap.keys()]
    )
    idsToClean.forEach(removeDoc)
    currentDocumentsRef.current = newMap
  }, [documents, removeDoc])

  useEffect(() => {
    const newMap = new Map(folders.map((folder) => [folder.id, folder]))
    const idsToClean: string[] = difference(
      [...currentFoldersRef.current.keys()],
      [...newMap.keys()]
    )
    idsToClean.forEach(removeFolder)
    currentFoldersRef.current = newMap
  }, [folders, removeFolder])

  const [statusFilterSet, setStatusFilterSet] = useState(
    new Set<DocStatus>(['in_progress', 'paused'])
  )

  const orderedDocs = useMemo(() => {
    const filteredDocs = documents
      .filter((doc) => {
        if (doc.status == null) {
          if (doc.archivedAt == null) {
            return true
          }
          return statusFilterSet.has('archived')
        }

        return statusFilterSet.has(doc.status)
      })
      .map((doc) => {
        return {
          ...doc,
          title: getDocTitle(doc, 'untitled'),
        }
      })
    switch (order) {
      case 'Title A-Z':
        return sortByAttributeAsc('title', filteredDocs)
      case 'Title Z-A':
        return sortByAttributeDesc('title', filteredDocs)
      case 'Latest Updated':
      default:
        return sortByAttributeDesc('updatedAt', filteredDocs)
    }
  }, [order, documents, statusFilterSet])

  const orderedFolders = useMemo(() => {
    switch (order) {
      case 'Title A-Z':
        return sortByAttributeAsc('name', folders)
      case 'Title Z-A':
        return sortByAttributeDesc('name', folders)
      case 'Latest Updated':
      default:
        return sortByAttributeDesc('updatedAt', folders)
    }
  }, [order, folders])

  const toggleStatusFilter = useCallback((status: DocStatus) => {
    setStatusFilterSet((previousSet) => {
      const newSet = new Set(previousSet)
      if (newSet.has(status)) {
        newSet.delete(status)
      } else {
        newSet.add(status)
      }
      return newSet
    })
  }, [])

  const selectingAllDocs = useMemo(() => {
    return orderedDocs.length > 0 && orderedDocs.every((doc) => hasDoc(doc.id))
  }, [orderedDocs, hasDoc])

  const selectingAllFolders = useMemo(() => {
    return (
      orderedFolders.length > 0 &&
      orderedFolders.every((folder) => hasFolder(folder.id))
    )
  }, [orderedFolders, hasFolder])

  const selectingAllItems =
    (selectingAllDocs && selectingAllFolders) ||
    (orderedFolders.length === 0 && selectingAllDocs) ||
    (orderedDocs.length === 0 && selectingAllFolders)

  const selectAllDocs = useCallback(() => {
    orderedDocs.forEach((doc) => addDoc(doc.id))
  }, [orderedDocs, addDoc])

  const selectAllFolders = useCallback(() => {
    orderedFolders.forEach((folder) => addFolder(folder.id))
  }, [orderedFolders, addFolder])

  const selectAllItems = useCallback(() => {
    orderedDocs.forEach((doc) => addDoc(doc.id))
    orderedFolders.forEach((folder) => addFolder(folder.id))
  }, [orderedDocs, orderedFolders, addDoc, addFolder])

  const unselectAllItems = useCallback(() => {
    resetDocs()
    resetFolders()
  }, [resetDocs, resetFolders])

  const onChangeOrder = useCallback(
    (val: CustomSelectOption) => {
      setOrder(val.data)
      setPreferences({ folderSortingOrder: val.data })
    },
    [setPreferences]
  )

  const [
    showingStatusFilterContextMenu,
    setShowingStatusFilterContextMenu,
  ] = useState(false)

  const filterMenuRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (filterMenuRef.current == null) {
      return
    }
    if (!showingStatusFilterContextMenu) {
      return
    }
    filterMenuRef.current.focus()
  }, [showingStatusFilterContextMenu])

  const handleStatusFilterContextMenuBlur = useCallback(
    (event: FocusEvent<HTMLDivElement>) => {
      if (!isChildNode(event.target, event.relatedTarget as Node)) {
        setShowingStatusFilterContextMenu(false)
      }
    },
    []
  )

  const openCreateDocForm = useCallback(() => {
    openNewDocForm(
      {
        team,
        workspaceId: currentWorkspaceId,
        parentFolderId: currentFolderId,
      },
      {
        precedingRows: [],
        beforeSubmitting: () => setSendingAction('new-doc'),
        afterSubmitting: () => setSendingAction(undefined),
      }
    )
  }, [openNewDocForm, currentWorkspaceId, currentFolderId, team])

  const openCreateFolderForm = useCallback(() => {
    openNewFolderForm(
      {
        team,
        workspaceId: currentWorkspaceId,
        parentFolderId: currentFolderId,
      },
      {
        precedingRows: [],
        beforeSubmitting: () => setSendingAction('new-folder'),
        afterSubmitting: () => setSendingAction(undefined),
      }
    )
  }, [openNewFolderForm, currentWorkspaceId, currentFolderId, team])

  return (
    <Container>
      <StyledContentManagerHeader>
        <div className='header__left'>
          {currentUserIsCoreMember && (
            <Checkbox
              checked={selectingAllItems}
              disabled={orderedDocs.length + orderedFolders.length === 0}
              className={cc([
                'header__left__checkbox',
                selectingAllItems && 'header__left__checkbox--checked',
              ])}
              onChange={selectingAllItems ? unselectAllItems : selectAllItems}
            />
          )}

          {currentUserIsCoreMember && (
            <ContentManagerBulkActions
              selectedDocs={selectedDocSet}
              selectedFolders={selectedFolderSet}
              documentsMap={currentDocumentsRef.current}
              foldersMap={currentFoldersRef.current}
              workspacesMap={workspacesMap}
              team={team}
              updating={updating}
              setUpdating={setUpdating}
            />
          )}
        </div>

        <div className='header__right'>
          <SortingOption value={order} onChange={onChangeOrder} />
        </div>
      </StyledContentManagerHeader>
      <StyledContentManagerList>
        <StyledContentManagerListHeader>
          {currentUserIsCoreMember && (
            <Checkbox
              className={cc([
                'header__checkbox',
                selectingAllFolders && 'header__checkbox--checked',
              ])}
              checked={selectingAllFolders}
              onChange={selectingAllFolders ? resetFolders : selectAllFolders}
            />
          )}
          <div className='header__label'>FOLDERS</div>
          {showCreateButtons && (
            <div className='header__control'>
              <LoadingButton
                variant='transparent'
                className='header__control__button'
                iconPath={mdiFolderPlusOutline}
                iconSize={16}
                spinning={sendingAction === 'new-folder'}
                disabled={sendingAction != null}
                onClick={openCreateFolderForm}
              />
            </div>
          )}
        </StyledContentManagerListHeader>
        {orderedFolders.map((folder) => (
          <ContentmanagerFolderRow
            folder={folder}
            key={folder.id}
            team={team}
            updating={updating.includes(getFolderId(folder))}
            setUpdating={setUpdating}
            checked={hasFolder(folder.id)}
            onSelect={() => toggleFolder(folder.id)}
            currentUserIsCoreMember={currentUserIsCoreMember}
          />
        ))}

        {orderedFolders.length === 0 && <EmptyRow label='No Folders' />}

        <StyledContentManagerListHeader>
          {currentUserIsCoreMember && (
            <Checkbox
              className={cc([
                'header__checkbox',
                selectingAllDocs && 'header__checkbox--checked',
              ])}
              checked={selectingAllDocs}
              onChange={selectingAllDocs ? resetDocs : selectAllDocs}
            />
          )}
          <div className='header__label'>DOCUMENTS</div>
          <div className='header__control'>
            <Button
              variant='transparent'
              className='header__control__button'
              iconPath={mdiFormatListChecks}
              iconSize={16}
              onClick={() => setShowingStatusFilterContextMenu(true)}
            />
            {showCreateButtons && (
              <LoadingButton
                variant='transparent'
                className='header__control__button'
                iconPath={mdiFilePlusOutline}
                iconSize={16}
                spinning={sendingAction === 'new-doc'}
                disabled={sendingAction != null}
                onClick={openCreateDocForm}
              />
            )}
          </div>
          {showingStatusFilterContextMenu && (
            <div
              className='header__filter-menu'
              ref={filterMenuRef}
              onBlur={handleStatusFilterContextMenuBlur}
              tabIndex={-1}
            >
              <div className='header__filter-menu__menu-item'>
                <Checkbox
                  className='header__filter-menu__menu-item__checkbox'
                  checked={statusFilterSet.has('in_progress')}
                  onChange={() => toggleStatusFilter('in_progress')}
                  label={
                    <div className='header__filter-menu__menu-item__checkbox__label'>
                      <DocStatusIcon
                        className='header__filter-menu__menu-item__checkbox__label__icon'
                        size={16}
                        status='in_progress'
                      />
                      <div className='header__filter-menu__menu-item__checkbox__label__text'>
                        In Progress
                      </div>
                    </div>
                  }
                />
              </div>
              <div className='header__filter-menu__menu-item'>
                <Checkbox
                  className='header__filter-menu__menu-item__checkbox'
                  checked={statusFilterSet.has('paused')}
                  onChange={() => toggleStatusFilter('paused')}
                  label={
                    <div className='header__filter-menu__menu-item__checkbox__label'>
                      <DocStatusIcon
                        className='header__filter-menu__menu-item__checkbox__label__icon'
                        size={16}
                        status='paused'
                      />
                      <div className='header__filter-menu__menu-item__checkbox__label__text'>
                        Paused
                      </div>
                    </div>
                  }
                />
              </div>
              <div className='header__filter-menu__menu-item'>
                <Checkbox
                  className='header__filter-menu__menu-item__checkbox'
                  checked={statusFilterSet.has('completed')}
                  onChange={() => toggleStatusFilter('completed')}
                  label={
                    <div className='header__filter-menu__menu-item__checkbox__label'>
                      <DocStatusIcon
                        className='header__filter-menu__menu-item__checkbox__label__icon'
                        size={16}
                        status='completed'
                      />
                      <div className='header__filter-menu__menu-item__checkbox__label__text'>
                        Completed
                      </div>
                    </div>
                  }
                />
              </div>
              <div className='header__filter-menu__menu-item'>
                <Checkbox
                  className='header__filter-menu__menu-item__checkbox'
                  checked={statusFilterSet.has('archived')}
                  onChange={() => toggleStatusFilter('archived')}
                  label={
                    <div className='header__filter-menu__menu-item__checkbox__label'>
                      <DocStatusIcon
                        className='header__filter-menu__menu-item__checkbox__label__icon'
                        size={16}
                        status='archived'
                      />
                      <div className='header__filter-menu__menu-item__checkbox__label__text'>
                        Archived
                      </div>
                    </div>
                  }
                />
              </div>
            </div>
          )}
        </StyledContentManagerListHeader>
        {orderedDocs.map((doc) => (
          <ContentManagerDocRow
            doc={doc}
            key={doc.id}
            workspace={workspacesMap.get(doc.workspaceId)}
            team={team}
            updating={updating.includes(getDocId(doc))}
            setUpdating={setUpdating}
            checked={hasDoc(doc.id)}
            onSelect={() => toggleDoc(doc.id)}
            showPath={page != null}
            currentUserIsCoreMember={currentUserIsCoreMember}
          />
        ))}
        {orderedDocs.length === 0 && <EmptyRow label='No Documents' />}
      </StyledContentManagerList>
    </Container>
  )
}

export default ContentManager

export const Container = styled.div``

export const StyledContentManagerHeader = styled.div`
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 0 8px;
  .header__left {
    display: flex;
    align-items: center;
  }
  .header__right {
    display: flex;
    align-items: center;
  }
  .header__left__checkbox {
    margin-right: 8px;
    opacity: 0;
    &.header__left__checkbox--checked {
      opacity: 1;
    }
  }

  &:hover {
    .header__left__checkbox {
      opacity: 1;
    }
  }
`

export const StyledContentManagerListHeader = styled.div`
  width: 100%;
  height: 24px;
  display: flex;
  align-items: center;
  background-color: ${({ theme }) => theme.colors.background.secondary};
  position: relative;
  padding: 0 8px;
  .header__label {
    flex: 1;
    line-height: 24px;
  }

  .header__checkbox {
    opacity: 0;
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;

    &.header__checkbox--checked {
      opacity: 1;
    }
  }

  &:hover {
    .header__checkbox {
      opacity: 1;
    }
  }
  .header__control {
  }

  .header__control__button {
    background-color: transparent;
    height: 24px;
  }

  .header__filter-menu {
    top: 28px;
    right: 4px;
    width: 140px;
    z-index: 1;
    position: absolute;
    background-color: ${({ theme }) => theme.colors.background.primary};
    border: solid 1px ${({ theme }) => theme.colors.border.main};
  }

  .header__filter-menu__menu-item {
    display: flex;
    align-items: center;
    height: 32px;
    padding: 0 4px;
  }
  .header__filter-menu__menu-item__checkbox {
    height: 100%;
    width: 100%;
  }
  .header__filter-menu__menu-item__checkbox__label {
    display: flex;
    align-items: center;
  }
  .header__filter-menu__menu-item__checkbox__label__icon {
    margin-right: 4px;
  }
`
