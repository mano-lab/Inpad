import React from 'react'
import styled from '../../../shared/lib/styled'
import { textOverflow } from '../../../shared/lib/styled/styleFunctions'

interface NavigationBarContainerProps {
  left?: React.ReactNode
  right?: React.ReactNode
  label?: React.ReactNode
}

const NavigationBarContainer = ({
  left,
  label,
  right,
}: NavigationBarContainerProps) => {
  return (
    <Container className='navigation_bar_container'>
      <div className='navigation_bar_container__left'>{left}</div>
      <div className='navigation_bar_container__label'>{label}</div>
      <div className='navigation_bar_container__right'>{right}</div>
    </Container>
  )
}
const Container = styled.div`
  &.navigation_bar_container {
    height: 48px;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.background.primary};
    border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
    display: flex;
  }

  .navigation_bar_container__left {
    width: 96px;
    display: flex;
  }
  .navigation_bar_container__label {
    flex: 1;
    ${textOverflow}
    display: flex;
    align-items: center;
    justify-content: center;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
  }
  .navigation_bar_container__right {
    width: 96px;
    justify-content: flex-end;
    display: flex;
  }
`

export default NavigationBarContainer
