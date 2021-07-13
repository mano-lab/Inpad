import React from 'react'
import Flexbox from '../../../cloud/components/atoms/Flexbox'
import { getFormattedBoosthubDateTime } from '../../../cloud/lib/date'
import EmojiIcon from '../../../cloud/components/atoms/EmojiIcon'
import { SerializedUser } from '../../../cloud/interfaces/db/user'
import EditorsIcons from '../../../cloud/components/atoms/EditorsIcons'
import { DocStatus } from '../../../cloud/interfaces/db/doc'
import DocStatusIcon from '../../../cloud/components/atoms/DocStatusIcon'
import styled from '../../../shared/lib/styled'

interface ContentManagerRowLinkContentProps {
  status?: DocStatus
  label: string
  emoji?: string
  defaultIcon?: string
  date: string
  editors?: SerializedUser[]
  path?: string
}

const ContentManagerRowLinkContent = ({
  status,
  defaultIcon,
  label,
  emoji,
  path,
  date,
  editors,
}: ContentManagerRowLinkContentProps) => (
  <Flexbox
    flex={'1 1 auto'}
    justifyContent='space-between'
    className='cm-row-link-content'
  >
    <Flexbox flex={'1 1 auto'}>
      {status && (
        <DocStatusIcon status={status} className='status-icon' size={16} />
      )}
      <EmojiIcon
        className='emoji-icon'
        defaultIcon={defaultIcon}
        emoji={emoji}
        size={16}
      />
      {path != null ? (
        <Flexbox
          className='label'
          direction='column'
          alignItems='baseline'
          justifyContent='center'
        >
          <PathLabel>{path}</PathLabel>
          <span>{label}</span>
        </Flexbox>
      ) : (
        <span className='label'>{label}</span>
      )}
    </Flexbox>

    <Flexbox flex='0 2 auto' className='date'>
      {getFormattedBoosthubDateTime(date)}
      {editors != null && editors.length > 0 && (
        <EditorsIcons editors={editors} />
      )}
    </Flexbox>
  </Flexbox>
)

export default ContentManagerRowLinkContent

const PathLabel = styled.span`
  color: ${({ theme }) => theme.colors.text.subtle};
  font-size: ${({ theme }) => theme.sizes.fonts.df}px;
  margin-bottom: ${({ theme }) => theme.sizes.spaces.xsm}px;
`
