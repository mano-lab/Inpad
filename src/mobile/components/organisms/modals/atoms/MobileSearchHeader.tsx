import React from 'react'
import styled from '../../../../../shared/lib/styled'
import { AppComponent } from '../../../../../shared/lib/types'
import cc from 'classcat'
import { overflowEllipsis } from '../../../../../shared/lib/styled/styleFunctions'

interface MobileSearchHeaderProps {
  label: string
}

const MobileSearchHeader: AppComponent<MobileSearchHeaderProps> = ({
  className,
  children,
  label,
}) => {
  return (
    <Container className={cc(['sidebar__header', className])}>
      <h4>{label}</h4>
      {children != null && (
        <div className='sidebar__header__children'>{children}</div>
      )}
    </Container>
  )
}

const Container = styled.div`
  &.sidebar__header {
    display: flex;
    justify-content: space-between;
    padding: ${({ theme }) => theme.sizes.spaces.sm}px
      ${({ theme }) => theme.sizes.spaces.df}px 0
      ${({ theme }) => theme.sizes.spaces.df}px;
    color: ${({ theme }) => theme.colors.text.secondary};
    margin-bottom: ${({ theme }) => theme.sizes.spaces.xsm}px;
    align-items: center;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
    & > h4 {
      flex: 1 1 20px;
      display: flex;
      align-items: center;
      margin: 0;
      font-weight: 400;
      height: 40px;
      ${overflowEllipsis};
    }
    .sidebar__header__children {
      flex: 0 0 auto;
    }
  }
`

export default MobileSearchHeader
