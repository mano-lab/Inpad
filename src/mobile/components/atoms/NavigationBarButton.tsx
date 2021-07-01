import React, { MouseEventHandler } from 'react'
import styled from '../../../shared/lib/styled'

interface NavigationBarButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>
}

const NavigationBarButton: React.FC<NavigationBarButtonProps> = ({
  onClick,
  children,
}) => {
  return <Container onClick={onClick}>{children}</Container>
}

export default NavigationBarButton

const Container = styled.button`
  height: 29px;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0 ${({ theme }) => theme.sizes.spaces.xsm}px;
  display: flex;
  align-items: center;
`
