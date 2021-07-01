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
      <Icon path={iconPath} />
    </Container>
  )
}

export default NavigationBarIconButton

const Container = styled.button`
  height: 29px;
  background-color: transparent;
  border: none;
  color: ${({ theme }) => theme.colors.text.primary};
  padding: 0 ${({ theme }) => theme.sizes.spaces.xsm}px;
`
