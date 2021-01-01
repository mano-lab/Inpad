import React from 'react'
import cc from 'classcat'
import styled from '../../lib/styled'
import Icon from './Icon'
import { mdiChevronDown, mdiChevronRight } from '@mdi/js'
import { textOverflow } from '../../lib/styled/styleFunctions'

const Container = styled.div`
  position: relative;
  user-select: none;
  height: 28px;
  display: flex;
  justify-content: space-between;
  align-items: center;
  width: 100%;

  font-size: 1em;
  transition: 200ms background-color;
  &:hover {
    .control {
      opacity: 1;
    }
    .counter {
      opacity: 0;
    }
  }

  &.visibleControl {
    .control {
      opacity: 1;
    }
  }
`

const FoldButton = styled.button`
  position: absolute;
  width: 24px;
  height: 24px;
  border: none;
  background-color: transparent;
  border-radius: 50%;
  top: 2px;
  display: flex;
  align-items: center;
  justify-content: center;

  transition: color 200ms ease-in-out;
  color: ${({ theme }) => theme.navButtonColor};
  &:hover {
    color: ${({ theme }) => theme.navButtonHoverColor};
  }

  &:active,
  .active {
    color: ${({ theme }) => theme.navButtonActiveColor};
  }
`

const ClickableContainer = styled.button`
  background-color: transparent;
  height: 28px;
  border: none;
  display: flex;
  align-items: center;
  text-align: left;
  flex: 1;
  overflow: hidden;
  cursor: pointer;

  color: ${({ theme }) => theme.navItemColor};
  background-color: ${({ theme }) => theme.navItemBackgroundColor};
  &:hover {
    background-color: ${({ theme }) => theme.navItemHoverBackgroundColor};
  }
  &:active,
  &.active {
    color: ${({ theme }) => theme.navItemActiveColor};
    background-color: ${({ theme }) => theme.navItemActiveBackgroundColor};
  }
  &:hover:active,
  &:hover.active {
    background-color: ${({ theme }) => theme.navItemHoverActiveBackgroundColor};
  }

  &.subtle {
    color: ${({ theme }) => theme.disabledUiTextColor};
  }
`

const Label = styled.div`
  ${textOverflow}
  flex: 1;
  &.subtle {
    color: ${({ theme }) => theme.disabledUiTextColor};
  }
`

const Control = styled.div`
  position: absolute;
  right: 0;
  top: 2px;
  opacity: 0;
  transition: opacity 200ms ease-in-out;
  display: flex;
`

const IconContainer = styled.div`
  width: 22px;
  height: 24px;
  display: flex;
  align-items: center;
  font-size: 18px;
`

const ItemCounter = styled.p`
  width: 24px;
  height: 24px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: ${({ theme }) => theme.navItemColor};
`

interface NavigatorItemProps {
  label: string
  iconPath?: string
  depth: number
  control?: React.ReactNode
  visibleControl?: boolean
  className?: string
  folded?: boolean
  active?: boolean
  count?: number
  subtle?: boolean
  onFoldButtonClick?: (event: React.MouseEvent) => void
  onClick?: (event: React.MouseEvent) => void
  onContextMenu?: (event: React.MouseEvent) => void
  onDrop?: (event: React.DragEvent) => void
  onDragOver?: (event: React.DragEvent) => void
  onDragEnd?: (event: React.DragEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
}

const NavigatorItem = ({
  label,
  iconPath,
  depth,
  control,
  visibleControl = false,
  className,
  folded,
  active,
  count,
  subtle,
  onFoldButtonClick,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDrop,
  onDragOver,
  onDragEnd,
}: NavigatorItemProps) => {
  return (
    <Container
      className={cc([
        className,
        active && 'active',
        visibleControl && 'visibleControl',
      ])}
      onContextMenu={onContextMenu}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      {folded != null && (
        <FoldButton
          className={folded ? 'folded' : ''}
          onClick={onFoldButtonClick}
          style={{ left: `${10 * depth}px` }}
        >
          <Icon path={folded ? mdiChevronRight : mdiChevronDown} size={18} />
        </FoldButton>
      )}
      <ClickableContainer
        style={{
          paddingLeft: `${10 * depth + 24}px`,
        }}
        onClick={onClick}
        onDoubleClick={onDoubleClick}
        className={active ? 'active' : ''}
      >
        {iconPath != null && (
          <IconContainer>
            <Icon path={iconPath} />
          </IconContainer>
        )}
        <Label className={cc([subtle && 'subtle'])}>{label}</Label>
        {count !== undefined && (
          <ItemCounter className={control ? 'counter' : ''}>
            {count}
          </ItemCounter>
        )}
      </ClickableContainer>
      {control && <Control className='control'>{control}</Control>}
    </Container>
  )
}

export default NavigatorItem
