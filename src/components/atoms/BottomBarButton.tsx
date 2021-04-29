import React, { MouseEventHandler, FC } from 'react'
import styled from '../../lib/styled'
import { flexCenter, borderLeft } from '../../lib/styled/styleFunctions'
import Tooltip from './Tooltip'

interface BottomBarButtonProps {
  className?: string
  onClick?: MouseEventHandler<HTMLButtonElement>
  tooltipText?: string
}

const BottomBarButton: FC<BottomBarButtonProps> = ({
  className,
  onClick,
  children,
  tooltipText,
}) => {
  return (
    <Tooltip space={10} text={tooltipText}>
      <Container className={className} onClick={onClick}>
        {children}
      </Container>
    </Tooltip>
  )
}

export default BottomBarButton

const Container = styled.button`
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.uiTextColor};
  font-size: 14px;
  ${flexCenter}
  padding: 0 5px;
  ${borderLeft}
  cursor: pointer;
  &:hover {
    background-color: ${({ theme }) => theme.navItemHoverBackgroundColor};
  }
`
