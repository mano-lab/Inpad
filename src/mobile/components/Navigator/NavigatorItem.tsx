import React from 'react'
import cc from 'classcat'
import styled from '../../../lib/styled'
import {
  sideBarTextColor,
  sideBarSecondaryTextColor,
  activeBackgroundColor,
  iconColor,
  coloredIconOpacity,
} from '../../../lib/styled/styleFunctions'
import {
  IconArrowSingleRight,
  IconArrowSingleDown,
} from '../../../components/icons'

const Container = styled.div`
  position: relative;
  user-select: none;
  height: 34px;
  display: flex;
  justify-content: space-between;

  .sideNavWrapper {
    min-width: 0;
    flex: 1 1 auto;

    button > span {
      width: 30px;
      ${iconColor}
    }

    button > span.colored {
      ${coloredIconOpacity}
    }
  }

  transition: 200ms background-color;
  &:hover,
  &:focus,
  &:active,
  &.active {
    ${activeBackgroundColor}

    button > span {
      ${sideBarTextColor}
    }

    button > span.colored {
      opacity: 1;
    }
  }
  &:hover {
    cursor: pointer;
  }

  &.allnotes-sidenav {
    padding-left: 4px !important;
    button {
      padding-left: 6px !important;
    }
  }
  &.bookmark-sidenav {
    padding-left: 4px !important;
    margin-bottom: 25px;
    button {
      padding-left: 6px !important;
    }
  }
`

const FoldButton = styled.button`
  position: absolute;
  width: 26px;
  height: 26px;
  padding-left: 10px;
  border: none;
  background-color: transparent;
  margin-right: 3px;
  border-radius: 2px;
  flex: 0 0 26px;
  top: 5px;
  ${sideBarSecondaryTextColor}
  &:focus {
    box-shadow: none;
  }
`

const ClickableContainer = styled.button`
  background-color: transparent;
  border: none;
  height: 35px;
  display: flex;
  align-items: center;
  min-width: 0;
  width: 100%;
  flex: 1 1 auto;

  ${sideBarTextColor}

  .icon {
    flex: 0 0 auto;
    margin-right: 4px;
    ${sideBarSecondaryTextColor}
  }
`

const Label = styled.div`
  min-width: 0;
  overflow: hidden;
  white-space: nowrap;
  flex: 1 1 auto;
  text-align: left;
`

const ControlContainer = styled.div`
  position: absolute;
  right: 0;
  top: 4px;
  padding-left: 10px;
  display: flex;
  flex: 2 0 auto;
  justify-content: flex-end;
  button {
    ${iconColor}
  }
`

const SideNavigatorItemIconContainer = styled.span`
  padding-right: 6px;
`

interface SideNaviagtorItemProps {
  label: string
  icon?: React.ReactNode
  depth: number
  controlComponents?: any[]
  className?: string
  folded?: boolean
  active?: boolean
  colored?: boolean
  onFoldButtonClick?: (event: React.MouseEvent) => void
  onClick?: (event: React.MouseEvent) => void
  onContextMenu?: (event: React.MouseEvent) => void
  onDrop?: (event: React.DragEvent) => void
  onDragOver?: (event: React.DragEvent) => void
  onDragEnd?: (event: React.DragEvent) => void
  onDoubleClick?: (event: React.MouseEvent) => void
}

const SideNaviagtorItem = ({
  label,
  icon,
  depth,
  controlComponents,
  className,
  folded,
  active,
  colored,
  onFoldButtonClick,
  onClick,
  onDoubleClick,
  onContextMenu,
  onDrop,
  onDragOver,
  onDragEnd,
}: SideNaviagtorItemProps) => {
  return (
    <Container
      className={cc([className, active && 'active'])}
      onContextMenu={onContextMenu}
      onDrop={onDrop}
      onDragOver={onDragOver}
      onDragEnd={onDragEnd}
    >
      <div className='sideNavWrapper'>
        {folded != null && (
          <FoldButton
            className={folded ? 'folded' : ''}
            onClick={onFoldButtonClick}
            style={{ left: `${10 * depth}px` }}
          >
            {folded ? (
              <IconArrowSingleRight color='currentColor' />
            ) : (
              <IconArrowSingleDown color='currentColor' />
            )}
          </FoldButton>
        )}
        <ClickableContainer
          style={{
            paddingLeft: `${10 * depth + 30}px`,
            cursor: onClick ? 'pointer' : 'initial',
            fontSize: '15px',
          }}
          onClick={onClick}
          onDoubleClick={onDoubleClick}
        >
          {icon != null && (
            <SideNavigatorItemIconContainer className={colored && 'colored'}>
              {icon}
            </SideNavigatorItemIconContainer>
          )}
          <Label>{label}</Label>
        </ClickableContainer>
      </div>
      {controlComponents && (
        <ControlContainer className='control'>
          {controlComponents}
        </ControlContainer>
      )}
    </Container>
  )
}

export default SideNaviagtorItem
