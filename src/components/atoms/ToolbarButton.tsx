import React, { MouseEventHandler } from 'react'
import styled from '../../lib/styled'
import Icon from './Icon'
import { flexCenter, textOverflow } from '../../lib/styled/styleFunctions'
import cc from 'classcat'
import Tooltip from './Tooltip'

interface ToolbarButtonProps {
  iconPath?: string
  label?: string
  title?: string
  active?: boolean
  onClick?: MouseEventHandler<HTMLButtonElement>
  limitWidth?: boolean
}

const ToolbarButton = ({
  iconPath,
  label,
  title,
  onClick,
  active,
  limitWidth,
}: ToolbarButtonProps) => {
  return (
    <Tooltip text={title == null ? label : title}>
      <Container
        className={cc([active && 'active', limitWidth && 'limitWidth'])}
        onClick={onClick}
      >
        {iconPath != null && <Icon className='icon' path={iconPath} />}
        {label != null && label.length > 0 && (
          <div className='label'>{label}</div>
        )}
      </Container>
    </Tooltip>
  )
}

export default ToolbarButton

const Container = styled.button`
  height: 34px;
  min-width: 28px;

  box-sizing: border-box;
  outline: none;

  background-color: transparent;
  ${flexCenter}
  overflow: hidden;

  border: none;
  cursor: pointer;
  padding: 0 5px;

  & > .icon {
    font-size: 18px;
    flex-shrink: 0;
  }

  & > .label {
    font-size: 14px;
    ${textOverflow}
  }
  & > .icon + .label {
    margin-left: 2px;
  }

  &.limitWidth > .label {
    max-width: 50px;
  }

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.navItemColor};
  &:hover {
    color: ${({ theme }) => theme.navButtonHoverColor};
  }

  &:active,
  &.active {
    color: ${({ theme }) => theme.navButtonActiveColor};
  }
`
