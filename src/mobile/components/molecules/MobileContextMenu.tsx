import React from 'react'
import {
  MenuTypes,
  menuVerticalPadding,
  menuZIndex,
  NormalMenuItem,
  useContextMenu,
} from '../../../shared/lib/stores/contextMenu'
import { useWindow } from '../../../shared/lib/stores/window'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'
import UpDownList from '../../../shared/components/atoms/UpDownList'
import cc from 'classcat'

const menuHeight = 48

const MobileContextMenu = () => {
  const { close, closed, menuItems, position, id } = useContextMenu()
  const {
    windowSize: { width: windowWidth },
  } = useWindow()

  const closeContextMenu = () => {
    close()
  }

  if (closed) return null

  return (
    <Container
      className='context__menu'
      tabIndex={-1}
      style={{
        left: position.x + 130 < windowWidth ? position.x : windowWidth - 150,
        top: position.y,
      }}
    >
      <UpDownList ignoreFocus={true} onBlur={closeContextMenu}>
        {menuItems.map((menu, index) => {
          const key = `context__menu--${id}-${index}`
          switch (menu.type) {
            case MenuTypes.Normal:
              const nMenu = {
                onClick: () => {
                  return
                },
                ...(menu as NormalMenuItem),
              }
              return (
                <button
                  className={cc([
                    'context__menu__item',
                    nMenu.active && 'context__menu__item--active',
                  ])}
                  key={key}
                  onClick={() => {
                    closeContextMenu()
                    nMenu.onClick()
                  }}
                  id={key}
                  disabled={nMenu.enabled == null ? false : !nMenu.enabled}
                >
                  {typeof nMenu.icon === 'string' ? (
                    <Icon path={nMenu.icon} size={20} />
                  ) : (
                    nMenu.icon
                  )}
                  {nMenu.label}
                </button>
              )
            case MenuTypes.Component:
              return <React.Fragment key={key}>{menu.component}</React.Fragment>
            case MenuTypes.Separator:
              return <div className='context__menu__separator' key={key} />
            default:
              return null
          }
        })}
      </UpDownList>
    </Container>
  )
}

export default MobileContextMenu

const Container = styled.div`
  min-width: 180px;
  position: fixed;
  z-index: ${menuZIndex};
  background-color: ${({ theme }) => theme.colors.background.primary};
  border: 1px solid ${({ theme }) => theme.colors.border.main};
  padding: ${menuVerticalPadding}px 0;
  font-size: ${({ theme }) => theme.sizes.fonts.df}px;
  box-sizing: border-box;
  border-radius: 4px;
  box-shadow: ${({ theme }) => theme.colors.shadow};
  outline: none;
  width: auto;

  .context__menu__item {
    height: ${menuHeight}px;
    padding: 0 ${({ theme }) => theme.sizes.spaces.df}px;
    box-sizing: border-box;
    background-color: transparent;
    border: none;
    display: flex;
    align-items: center;
    width: 100%;
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
    text-align: left;
    transition: 200ms color;
    color: ${({ theme }) => theme.colors.text.primary};

    > * {
      pointer-events: none;
    }

    &:disabled {
      color: ${({ theme }) => theme.colors.text.subtle};
    }

    &:active,
    &.active,
    &.context__menu__item--active {
      background-color: ${({ theme }) => theme.colors.variants.primary.base};
      color: ${({ theme }) => theme.colors.variants.primary.text};
    }

    &:hover {
      background-color: ${({ theme }) => theme.colors.background.quaternary};
      color: ${({ theme }) => theme.colors.text.primary};
    }

    &:focus {
      background-color: ${({ theme }) => theme.colors.background.tertiary};
      color: ${({ theme }) => theme.colors.text.primary};
    }

    &:disabled {
      background-color: transparent;
    }

    span {
      display: flex;
      align-items: center;
    }
    svg {
      margin-right: ${({ theme }) => theme.sizes.spaces.xsm}px;
    }
  }

  .context__menu__separator {
    height: 1px;
    margin: ${({ theme }) => theme.sizes.spaces.xsm}px 0;
    border: 1px solid ${({ theme }) => theme.colors.border.main};
  }
`
