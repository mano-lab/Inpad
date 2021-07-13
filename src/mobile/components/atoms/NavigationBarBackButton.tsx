import React, { MouseEventHandler } from 'react'
import NavigationBarButton from './NavigationBarButton'
import Icon from '../../../shared/components/atoms/Icon'
import { mdiArrowLeft } from '@mdi/js'

interface NavigationBarBackButtonProps {
  onClick: MouseEventHandler<HTMLButtonElement>
}

const NavigationBarBackButton = ({ onClick }: NavigationBarBackButtonProps) => {
  return (
    <NavigationBarButton onClick={onClick}>
      <Icon size={20} path={mdiArrowLeft} /> Back
    </NavigationBarButton>
  )
}

export default NavigationBarBackButton
