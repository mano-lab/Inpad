import React, { useMemo } from 'react'
import {
  getTimelinePageData,
  TimelinePageData,
} from '../../../cloud/api/pages/teams/timeline'
import { isSameDay, isBefore, subDays, formatDistanceToNow } from 'date-fns'
import { partition } from 'ramda'
import TimelineList from '../../../cloud/components/molecules/Timeline/TimelineList'
import styled from '../../../cloud/lib/styled'
import TeamLink from '../../../cloud/components/atoms/Link/TeamLink'
import { linkText } from '../../../cloud/lib/styled/styleFunctions'
import { usePage } from '../../../cloud/lib/stores/pageStore'
import { buildIconUrl } from '../../../cloud/api/files'
import { SerializedUser } from '../../../cloud/interfaces/db/user'
import { getColorFromString } from '../../../cloud/lib/utils/string'
import { GetInitialPropsParameters } from '../../../cloud/interfaces/pages'
import AppLayout from '../layouts/AppLayout'

export interface TimelineUser {
  user: SerializedUser
  icon: React.ReactNode
  color: string
}

const TimelinePage = ({ team, events }: TimelinePageData) => {
  const { permissions = [] } = usePage()

  const { today, thisWeek, others } = useMemo(() => {
    const todayDate = new Date()
    const sevenDaysAgo = subDays(todayDate, 7)

    const [today, rest] = partition(
      (event) => isSameDay(new Date(event.createdAt), todayDate),
      events
    )

    const [thisWeek, others] = partition(
      (event) => isBefore(sevenDaysAgo, new Date(event.createdAt)),
      rest
    )

    return { today, thisWeek, others }
  }, [events])

  const usersMap = useMemo(() => {
    const map = new Map<string, TimelineUser>()
    permissions.forEach((permission) => {
      map.set(permission.user.id, {
        user: permission.user,
        icon:
          permission.user.icon != null ? (
            <img
              src={buildIconUrl(permission.user.icon.location)}
              alt={permission.user.displayName[0]}
            />
          ) : (
            permission.user.displayName[0]
          ),
        color: getColorFromString(permission.user.id),
      })
    })

    return map
  }, [permissions])

  if (today.length + thisWeek.length + others.length === 0) {
    return (
      <AppLayout title='Timeline'>
        <StyledTimelinePage>
          <p className='no-document'>
            No documents have been created. Share your knowledge with your
            teammates!
          </p>
        </StyledTimelinePage>
      </AppLayout>
    )
  }

  return (
    <AppLayout title='Timeline'>
      <StyledTimelinePage>
        {today.length > 0 ? (
          <TimelineList
            heading='Today'
            team={team}
            events={today}
            usersMap={usersMap}
            timeFormat={dateFormatDistanceToNow}
          />
        ) : (
          <>
            <h2>Today</h2>
            <p className='no-event'>No new events today!</p>
          </>
        )}
        <TimelineList
          heading='Past 7 days'
          team={team}
          events={thisWeek}
          usersMap={usersMap}
        />

        <TimelineList
          heading='More than 7 days ago'
          team={team}
          events={others}
          usersMap={usersMap}
        />
        {events.length !== 10 && events.length % 10 === 0 && (
          <div className='more-button'>
            <TeamLink
              team={team}
              query={{ amount: Math.max(events.length, 20) + 10 }}
              intent='timeline'
            >
              Show More..
            </TeamLink>
          </div>
        )}
      </StyledTimelinePage>
    </AppLayout>
  )
}

TimelinePage.getInitialProps = async (params: GetInitialPropsParameters) => {
  const result = await getTimelinePageData(params)
  return result
}

export default TimelinePage

function dateFormatDistanceToNow(date: Date) {
  return `${formatDistanceToNow(date)} ago`
}

const StyledTimelinePage = styled.div`
  padding-bottom: ${({ theme }) => theme.space.default}px;

  .no-event,
  .no-document {
    margin-top: ${({ theme }) => theme.space.default}px;
    font-size: ${({ theme }) => theme.fontSizes.small}px;
  }

  h1 {
    margin: ${({ theme }) => theme.space.large}px 0;
  }

  h2 {
    color: ${({ theme }) => theme.subtleTextColor};
    font-size: ${({ theme }) => theme.fontSizes.default}px;
    padding: ${({ theme }) => theme.space.xsmall}px 0;
    margin-top: ${({ theme }) => theme.space.large}px;
    margin-bottom: 0;
    border-bottom: 1px solid ${({ theme }) => theme.subtleBorderColor};
  }

  .more-button {
    display: flex;
    justify-content: center;
    margin-top: ${({ theme }) => theme.space.default}px;

    > a {
      ${linkText}
    }
  }
`
