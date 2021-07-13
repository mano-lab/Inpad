import React, { useState, useCallback, useMemo, useRef } from 'react'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { useNav } from '../../../../cloud/lib/stores/nav'
import {
  mdiHistory,
  mdiClockOutline,
  mdiLabelMultipleOutline,
  mdiArrowBottomLeft,
  mdiListStatus,
  mdiAccountCircleOutline,
  mdiAccountMultiple,
  mdiContentSaveOutline,
} from '@mdi/js'
import {
  SerializedDocWithBookmark,
  SerializedDoc,
  DocStatus,
} from '../../../../cloud/interfaces/db/doc'
import { getFormattedDateTime } from '../../../../cloud/lib/date'
import { SerializedTeam } from '../../../../cloud/interfaces/db/team'
import {
  updateDocStatus,
  updateDocDueDate,
  updateDocAssignees,
} from '../../../../cloud/api/teams/docs'
import { SerializedRevision } from '../../../../cloud/interfaces/db/revision'
import { MixpanelActionTrackTypes } from '../../../../cloud/interfaces/analytics/mixpanel'
import { trackEvent } from '../../../../cloud/api/track'
import { SerializedUser } from '../../../../cloud/interfaces/db/user'
import Flexbox from '../../../../cloud/components/atoms/Flexbox'
import UserIcon from '../../../../cloud/components/atoms/UserIcon'
import SmallButton from '../../../../cloud/components/atoms/SmallButton'
import DocTagsList from '../../../../cloud/components/molecules/DocTagsList'
import DocLink from '../../../../cloud/components/atoms/Link/DocLink'
import { getDocTitle } from '../../../../cloud/lib/utils/patterns'
import { usePreferences } from '../../../lib/preferences'
import cc from 'classcat'
import Icon from '../../../../shared/components/atoms/Icon'
import DocShare from '../../../../cloud/components/molecules/DocShare'
import plur from 'plur'
import Button from '../../../../shared/components/atoms/Button'
import { revisionHistoryStandardDays } from '../../../../cloud/lib/subscription'
import { useToast } from '../../../../shared/lib/stores/toast'
import { useModal } from '../../../../shared/lib/stores/modal'
import styled from '../../../../shared/lib/styled'
import { format as formatDate } from 'date-fns'
import { useI18n } from '../../../../cloud/lib/hooks/useI18n'
import { lngKeys } from '../../../../cloud/lib/i18n/types'
import RevisionsModal from '../../../../cloud/components/organisms/Modal/contents/Doc/RevisionsModal'
import UpgradeIntroButton from '../../../../cloud/components/UpgradeIntroButton'
import DocDueDateSelect from '../../../../cloud/components/organisms/Topbar/Controls/ControlsContextMenu/DocContextMenu/DocDueDateSelect'
import DocStatusSelect from '../../../../cloud/components/organisms/Topbar/Controls/ControlsContextMenu/DocContextMenu/DocStatusSelect'
import DocAssigneeSelect from '../../../../cloud/components/organisms/Topbar/Controls/ControlsContextMenu/DocContextMenu/DocAssigneeSelect'
import ModalContainer from './atoms/ModalContainer'

interface DocInfoModalProps {
  currentDoc: SerializedDocWithBookmark
  contributors: SerializedUser[]
  backLinks: SerializedDoc[]
  revisionHistory?: SerializedRevision[]
  team: SerializedTeam
  restoreRevision?: (revision: SerializedRevision) => void
}

const DocInfoModal = ({
  team,
  currentDoc: _currentDoc,
  contributors,
  backLinks,
  restoreRevision,
}: DocInfoModalProps) => {
  const [sendingUpdateStatus, setSendingUpdateStatus] = useState(false)
  const [sendingDueDate, setSendingDueDate] = useState(false)
  const { updateDocsMap, docsMap } = useNav()
  const {
    setPartialPageData,
    subscription,
    permissions = [],
    currentUserPermissions,
    currentUserIsCoreMember,
  } = usePage()
  const { pushMessage } = useToast()
  const { openModal } = useModal()
  const [sliceContributors, setSliceContributors] = useState(true)
  const { preferences } = usePreferences()
  const menuRef = useRef<HTMLDivElement>(null)
  const { translate } = useI18n()

  const currentDoc = docsMap.get(_currentDoc.id)!

  const usersMap = useMemo(() => {
    const users = permissions.reduce((acc, val) => {
      acc.set(val.user.id, val.user)
      return acc
    }, new Map<string, SerializedUser>())

    return users
  }, [permissions])

  const contributorsState = useMemo(() => {
    let allContributors = contributors
    let sliced = 0
    if (sliceContributors && contributors.length > 5) {
      allContributors = contributors.slice(0, 5)
      sliced = contributors.length - 5
    }

    return {
      contributors: allContributors,
      sliced,
    }
  }, [contributors, sliceContributors])

  const revisionNavigateCallback = useCallback(() => {
    openModal(
      <RevisionsModal
        currentDoc={currentDoc}
        restoreRevision={currentUserIsCoreMember ? restoreRevision : undefined}
      />,
      {
        width: 'large',
      }
    )
    trackEvent(MixpanelActionTrackTypes.RevisionHistoryOpen, {
      docId: currentDoc.id,
    })
  }, [currentDoc, openModal, restoreRevision, currentUserIsCoreMember])

  const sendUpdateStatus = useCallback(
    async (newStatus: DocStatus | null) => {
      if (currentDoc.status === newStatus) {
        return
      }
      if (sendingUpdateStatus || currentDoc == null) {
        return
      }

      setSendingUpdateStatus(true)
      try {
        const data = await updateDocStatus(
          currentDoc.teamId,
          currentDoc.id,
          newStatus
        )
        updateDocsMap([data.doc.id, data.doc])
        setPartialPageData({ pageDoc: data.doc })
      } catch (error) {
        pushMessage({
          title: 'Error',
          description: 'Could not change status',
        })
      }
      setSendingUpdateStatus(false)
    },
    [
      currentDoc,
      pushMessage,
      sendingUpdateStatus,
      setPartialPageData,
      updateDocsMap,
    ]
  )

  const sendUpdateDocDueDate = useCallback(
    async (newDate: Date | null) => {
      if (sendingUpdateStatus || currentDoc == null) {
        return
      }

      setSendingDueDate(true)
      try {
        const data = await updateDocDueDate(
          currentDoc.teamId,
          currentDoc.id,
          newDate != null
            ? new Date(formatDate(newDate, 'yyyy-MM-dd') + 'T00:00:00.000Z')
            : null
        )
        updateDocsMap([data.doc.id, data.doc])
        setPartialPageData({ pageDoc: data.doc })
      } catch (error) {
        pushMessage({
          title: 'Error',
          description: 'Could not update due date',
        })
      }
      setSendingDueDate(false)
    },
    [
      currentDoc,
      pushMessage,
      sendingUpdateStatus,
      setPartialPageData,
      updateDocsMap,
    ]
  )

  const [sendingAssignees, setSendingAssignees] = useState(false)

  const sendUpdateDocAssignees = useCallback(
    async (newAssignees: string[]) => {
      if (sendingUpdateStatus || currentDoc == null) {
        return
      }

      setSendingAssignees(true)
      try {
        const data = await updateDocAssignees(
          currentDoc.teamId,
          currentDoc.id,
          newAssignees
        )
        updateDocsMap([data.doc.id, data.doc])
        setPartialPageData({ pageDoc: data.doc })
      } catch (error) {
        pushMessage({
          title: 'Error',
          description: 'Could not update assignees',
        })
      }
      setSendingAssignees(false)
    },
    [
      currentDoc,
      pushMessage,
      sendingUpdateStatus,
      setPartialPageData,
      updateDocsMap,
    ]
  )

  const creator =
    currentDoc.userId != null ? usersMap.get(currentDoc.userId) : undefined

  return (
    <ModalContainer title={currentDoc.title} closeLabel='Done'>
      <Container
        className={cc([preferences.docContextMode !== 'hidden' && 'active'])}
      >
        <div ref={menuRef} className='context__menu'>
          <div className='context__container'>
            <div className='context__scroll__container'>
              <div className='context__scroll'>
                <div className='context__row'>
                  <div className='context__header'>
                    {translate(lngKeys.DocInfo)}
                  </div>
                </div>
                {!team.personal && (
                  <div className='context__row'>
                    <label className='context__label'>
                      <Icon
                        path={mdiAccountCircleOutline}
                        size={20}
                        className='context__icon'
                      />{' '}
                      {translate(lngKeys.Assignees)}
                    </label>
                    <div className='context__content'>
                      <span>
                        <DocAssigneeSelect
                          isLoading={sendingAssignees}
                          disabled={
                            sendingAssignees || !currentUserIsCoreMember
                          }
                          defaultValue={
                            currentDoc.assignees != null
                              ? currentDoc.assignees.map(
                                  (assignee) => assignee.userId
                                )
                              : []
                          }
                          readOnly={!currentUserIsCoreMember}
                          update={sendUpdateDocAssignees}
                        />
                      </span>
                    </div>
                  </div>
                )}

                <div className='context__row'>
                  <label className='context__label'>
                    <Icon
                      path={mdiListStatus}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.GeneralStatus)}
                  </label>
                  <div className='context__content'>
                    <DocStatusSelect
                      status={currentDoc.status}
                      sending={sendingUpdateStatus}
                      onStatusChange={sendUpdateStatus}
                      disabled={!currentUserIsCoreMember}
                      isReadOnly={!currentUserIsCoreMember}
                    />
                  </div>
                </div>

                <div className='context__row'>
                  <label className='context__label'>
                    <Icon
                      path={mdiClockOutline}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.DueDate)}
                  </label>
                  <div className='context__content'>
                    <DocDueDateSelect
                      className='context__content__date_select'
                      sending={sendingDueDate}
                      dueDate={currentDoc.dueDate}
                      onDueDateChange={sendUpdateDocDueDate}
                      disabled={!currentUserIsCoreMember}
                      isReadOnly={!currentUserIsCoreMember}
                    />
                  </div>
                </div>

                <div className='context__row'>
                  <label className='context__label' style={{ height: 32 }}>
                    <Icon
                      path={mdiLabelMultipleOutline}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.GeneralLabels)}
                  </label>
                  <div className='context__content'>
                    <DocTagsList
                      team={team}
                      doc={currentDoc}
                      readOnly={!currentUserIsCoreMember}
                    />
                  </div>
                </div>

                <div className='context__break' />

                <div className='context__row'>
                  <label className='context__label'>
                    <Icon
                      path={mdiClockOutline}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.CreationDate)}
                  </label>
                  <div className='context__content'>
                    <span>
                      {getFormattedDateTime(
                        currentDoc.createdAt,
                        undefined,
                        'MMM dd, yyyy, HH:mm'
                      )}
                    </span>
                  </div>
                </div>
                {!team.personal && creator != null && (
                  <div className='context__row'>
                    <label className='context__label'>
                      <Icon
                        path={mdiAccountCircleOutline}
                        size={20}
                        className='context__icon'
                      />{' '}
                      {translate(lngKeys.CreatedBy)}
                    </label>
                    <div className='context__content'>
                      <Flexbox wrap='wrap'>
                        <UserIcon
                          key={creator.id}
                          user={creator}
                          className='subtle'
                        />
                      </Flexbox>
                    </div>
                  </div>
                )}
                <div className='context__row'>
                  <label className='context__label'>
                    <Icon
                      path={mdiContentSaveOutline}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.UpdateDate)}
                  </label>
                  <div className='context__content'>
                    <Flexbox wrap='wrap'>
                      {currentDoc.head != null
                        ? getFormattedDateTime(
                            currentDoc.head.created,
                            undefined,
                            'MMM dd, yyyy, HH:mm'
                          )
                        : getFormattedDateTime(
                            currentDoc.updatedAt,
                            undefined,
                            'MMM dd, yyyy, HH:mm'
                          )}
                    </Flexbox>
                  </div>
                </div>
                {!team.personal && (
                  <div className='context__row'>
                    <label className='context__label'>
                      <Icon
                        path={mdiAccountCircleOutline}
                        size={20}
                        className='context__icon'
                      />{' '}
                      {translate(lngKeys.UpdatedBy)}
                    </label>
                    <div className='context__content'>
                      <Flexbox wrap='wrap'>
                        {currentDoc.head != null ? (
                          (currentDoc.head.creators || []).length > 0 ? (
                            <>
                              {(currentDoc.head.creators || []).map((user) => (
                                <UserIcon
                                  key={user.id}
                                  user={usersMap.get(user.id) || user}
                                  className='subtle'
                                />
                              ))}
                            </>
                          ) : (
                            ''
                          )
                        ) : (
                          ''
                        )}
                      </Flexbox>
                    </div>
                  </div>
                )}
                {!team.personal && (
                  <div className='context__row'>
                    <label className='context__label'>
                      <Icon
                        path={mdiAccountMultiple}
                        size={20}
                        className='context__icon'
                      />{' '}
                      {translate(lngKeys.Contributors)}
                    </label>
                    <div className='context__content'>
                      <Flexbox wrap='wrap'>
                        {contributorsState.contributors.map((contributor) => (
                          <UserIcon
                            key={contributor.id}
                            user={usersMap.get(contributor.id) || contributor}
                            className='subtle'
                          />
                        ))}

                        {contributors.length > 5 && (
                          <SmallButton
                            variant='transparent'
                            onClick={() =>
                              setSliceContributors((prev) => !prev)
                            }
                          >
                            {contributorsState.sliced > 0
                              ? `+${contributorsState.sliced}`
                              : '-'}
                          </SmallButton>
                        )}
                      </Flexbox>
                    </div>
                  </div>
                )}
                <Flexbox
                  className='context__row'
                  justifyContent='space-between'
                >
                  <label className='context__label'>
                    <Icon
                      path={mdiHistory}
                      size={20}
                      className='context__icon'
                    />{' '}
                    {translate(lngKeys.History)}
                  </label>
                  <Flexbox
                    className='context__content'
                    justifyContent='flex-end'
                  >
                    {subscription == null ? (
                      <UpgradeIntroButton
                        className='context__badge'
                        origin='revision'
                        variant='secondary'
                        popupVariant='version-history'
                        query={{ teamId: team.id, docId: currentDoc.id }}
                      />
                    ) : (
                      <Button
                        variant='primary'
                        onClick={revisionNavigateCallback}
                        size='sm'
                      >
                        {subscription != null &&
                        subscription.plan === 'standard'
                          ? translate(lngKeys.SeeLimitedHistory, {
                              days: revisionHistoryStandardDays,
                            })
                          : translate(lngKeys.SeeFullHistory)}
                      </Button>
                    )}
                  </Flexbox>
                </Flexbox>
                <div className='context__break' />
                {currentUserPermissions != null && (
                  <>
                    <div className='context__row'>
                      <div className='context__header'>
                        {translate(lngKeys.Share)}
                      </div>
                    </div>
                    <DocShare currentDoc={currentDoc} team={team} />
                    {backLinks.length > 0 && (
                      <>
                        <div className='context__break' />
                        <div className='context__column'>
                          <label className='context__label context__header'>
                            {backLinks.length}{' '}
                            {plur('Backlink', backLinks.length)}
                          </label>
                          <ul className='context__list'>
                            {backLinks.map((doc) => (
                              <li key={doc.id}>
                                <DocLink
                                  doc={doc}
                                  team={team}
                                  className='context__backlink'
                                  id={`context__backlink__${doc.id}`}
                                >
                                  <Icon
                                    path={mdiArrowBottomLeft}
                                    size={20}
                                    className='context__icon'
                                  />
                                  {getDocTitle(doc)}
                                </DocLink>
                              </li>
                            ))}
                          </ul>
                        </div>
                      </>
                    )}
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      </Container>
    </ModalContainer>
  )
}

export default DocInfoModal

export const docContextWidth = 350

const Container = styled.div`
  .context__tooltip {
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    background: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    width: 20px;
    height: 20px;
    margin-left: ${({ theme }) => theme.sizes.spaces.xsm}px;

    .context__tooltip__text {
      display: none;
      border-radius: 3px;
      position: absolute;
      bottom: 100%;
      background: ${({ theme }) => theme.colors.background.primary};
      width: ${docContextWidth - 40}px;
      padding: ${({ theme }) => theme.sizes.spaces.xsm}px;
      left: 50%;
      transform: translateX(-50%);
      line-height: ${({ theme }) => theme.sizes.fonts.md}px;
    }

    &:hover {
      .context__tooltip__text {
        display: block;
      }
    }
  }

  .context__menu {
    margin: auto;
    width: 100%;
    display: flex;
    flex-direction: column;
    border-left: 1px solid ${({ theme }) => theme.colors.border.main};
    border-radius: 0px;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
  }

  .context__container {
    position: relative;
    width: 100%;
  }

  .context__scroll__container {
    height: 100%;
    overflow: auto;
    padding: ${({ theme }) => theme.sizes.spaces.xsm}px 0;
    scrollbar-width: thin;
    &::-webkit-scrollbar {
      width: 6px;
    }
  }

  .context__scroll {
    flex: 1 1 auto;
    width: 100%;
    height: 100%;
    overflow: hidden auto;
  }

  .context__row,
  .context__column {
    position: relative;
    display: flex;
    align-items: flex-start;
    line-height: 32px;
    font-size: ${({ theme }) => theme.sizes.fonts.df}px;
    padding: 0px ${({ theme }) => theme.sizes.spaces.df}px;
    height: fit-content;
  }
  .context__header {
    font-size: ${({ theme }) => theme.sizes.fonts.md}px !important;
    color: ${({ theme }) => theme.colors.text.secondary} !important;
    text-transform: uppercase;
  }

  .context__column {
    flex-direction: column;
  }

  .context__label {
    display: flex;
    align-items: center;
    color: ${({ theme }) => theme.colors.text.secondary};
    font-size: 13px;
    width: 120px;
    flex: 0 0 auto;
    margin-bottom: 0;
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
    cursor: inherit;
  }

  .context__content {
    line-height: inherit;
    min-height: 30px;
    flex: 1;
    color: ${({ theme }) => theme.colors.text.primary};

    &.single__line {
      display: flex;
      align-items: center;
    }
  }
  .context__content__date_select {
    width: 100%;
  }

  .context__break {
    display: block;
    height: 1px;
    margin: ${({ theme }) => theme.sizes.spaces.xsm}px
      ${({ theme }) => theme.sizes.spaces.sm}px;
    background-color: ${({ theme }) => theme.colors.border.second};
  }

  .context__button {
    width: 100%;
    text-align: left;
  }

  .context__flexible__button {
    flex-wrap: wrap;
    border-radius: 3px;
    max-width: 96%;
    width: auto;
    margin: 0 auto;
    padding: 2px 5px;
  }

  .context__button,
  .context__flexible__button {
    display: flex;
    align-items: center;
    background: none;
    outline: none;
    color: ${({ theme }) => theme.colors.text.primary};
    cursor: pointer;
    font-size: 13px;
    &:hover,
    &:focus {
      background-color: ${({ theme }) => theme.colors.background.secondary};
      color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
      color: ${({ theme }) => theme.colors.text.subtle};

      &:hover,
      &:focus {
        color: ${({ theme }) => theme.colors.text.subtle} !important;
        background-color: transparent;
        cursor: not-allowed;
      }
    }
  }

  .content__row__label__column {
    height: 50px;
    > * {
      line-height: 26px;
    }
    .context__label__description {
      color: ${({ theme }) => theme.colors.text.subtle};
      line-height: 15px;
    }
  }

  .context__flexible__button + div {
    margin: ${({ theme }) => theme.sizes.spaces.xsm}px 0;
  }

  .context__label + .context__badge {
    margin-left: 0;
  }

  .context__list {
    margin: 0;
    padding: 0;
    list-style: none;
  }

  .context__icon {
    margin-right: ${({ theme }) => theme.sizes.spaces.xsm}px;
    flex: 0 0 auto;
  }

  .context__backlink + .context__backlink {
    margin-top: ${({ theme }) => theme.sizes.spaces.xsm}px;
  }

  .context__backlink {
    display: flex;
    align-items: end;
    line-height: 18px;
    text-decoration: none;

    transition: 200ms color;
    color: ${({ theme }) => theme.colors.text.primary};

    &:hover,
    &:focus,
    &:active,
    &.active {
      text-decoration: underline;
    }

    &:disabled {
      color: ${({ theme }) => theme.colors.text.subtle};
    }
  }

  .context__list + .context__flexible__button {
    margin-top: ${({ theme }) => theme.sizes.spaces.df}px;
  }

  &.active {
    .context__menu {
      right: 0px;
    }

    .placeholder {
      width: ${docContextWidth + 45}px;
    }
  }

  .context__content__button {
    width: 100%;
  }
`
