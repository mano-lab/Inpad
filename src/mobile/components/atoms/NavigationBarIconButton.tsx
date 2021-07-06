import React, { MouseEventHandler } from 'react'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'

interface NavigationBarIconButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>
  iconPath: string
}

const NavigationBarIconButton = ({
  onClick,
  iconPath,
}: NavigationBarIconButtonProps) => {
  return (
    <Container onClick={onClick}>
      <Icon size={20} path={iconPath} />
    </Container>
  )
}

export default NavigationBarIconButton

const Container = styled.button`
  height: 47px;
  width: 47px;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.subtle};
  font-size: ${({ theme }) => theme.sizes.fonts.md}px;
`
