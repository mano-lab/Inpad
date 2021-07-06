import React, { useCallback } from 'react'
import styled from '../../../../shared/lib/styled'
import cc from 'classcat'
import Button from '../../../../shared/components/atoms/Button'
import { mdiChevronDown, mdiChevronRight, mdiDotsHorizontal } from '@mdi/js'
import { Emoji } from 'emoji-mart'
import Icon from '../../../../shared/components/atoms/Icon'
import { FoldingProps } from '../../../../shared/components/atoms/FoldingWrapper'
import {
  MenuItem,
  useContextMenu,
} from '../../../../shared/lib/stores/contextMenu'
import { overflowEllipsis } from '../../../../shared/lib/styled/styleFunctions'

interface NavigatorItemProps {
  className?: string
  defaultIcon?: string
  depth: number
  emoji?: string
  folded?: boolean
  folding?: FoldingProps
  id?: string
  label: string
  labelHref?: string
  labelClick?: () => void
  controls?: {
    icon: string
    onClick: (event: React.MouseEvent<HTMLButtonElement>) => void
    disabled?: boolean
  }[]
  contextControls?: MenuItem[]
  active?: boolean
  isCategory?: boolean
}

const NavigatorItem: React.FC<NavigatorItemProps> = ({
  className,
  depth,
  defaultIcon,
  emoji,
  folding,
  folded,
  id,
  label,
  labelHref,
  labelClick,
  controls,
  contextControls,
  active,
  isCategory,
}) => {
  const { popup } = useContextMenu()
  const LabelTag = labelHref != null ? 'a' : 'button'

  const onClick: React.MouseEventHandler = useCallback(
    (event) => {
      if (labelClick == null) {
        return
      }
      event.preventDefault()
      labelClick()
    },
    [labelClick]
  )

  return (
    <Container
      depth={depth > 6 ? 6 : depth}
      className={cc([
        className,
        'sidebar__tree__item',
        isCategory && 'sidebar__category',
        active && 'sidebar__tree__item--active',
      ])}
    >
      <div className='sidebar__tree__item__wrapper' draggable={false}>
        {folded != null && (
          <Button
            variant='icon'
            iconSize={20}
            iconPath={folded ? mdiChevronRight : mdiChevronDown}
            className='sidebar__tree__item__icon'
            size='sm'
            onClick={folding?.toggle}
          />
        )}
        <LabelTag
          className='sidebar__tree__item__label'
          onClick={onClick}
          href={labelHref}
          id={`tree-${id}`}
          tabIndex={1}
          draggable={false}
        >
          {emoji != null ? (
            <Emoji emoji={emoji} set='apple' size={20} />
          ) : defaultIcon != null ? (
            <Icon path={defaultIcon} size={20} />
          ) : null}
          <span className='sidebar__tree__item__label__ellipsis'>{label}</span>
        </LabelTag>
        {(controls != null || contextControls != null) && (
          <div className='sidebar__tree__item__controls'>
            {(controls || []).map((control, i) => (
              <Button
                key={i}
                variant='icon'
                iconSize={20}
                iconPath={control.icon}
                tabIndex={-1}
                className='sidebar__tree__item__control'
                size='sm'
                onClick={control.onClick}
              />
            ))}
            {contextControls != null && (
              <Button
                variant='icon'
                iconSize={20}
                iconPath={mdiDotsHorizontal}
                tabIndex={-1}
                className='sidebar__tree__item__control'
                size='sm'
                onClick={(event) => popup(event, contextControls)}
              />
            )}
          </div>
        )}
      </div>
    </Container>
  )
}

const Container = styled.div<{ depth: number }>`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 48px;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.sizes.fonts.md}px;

  border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  .sidebar__tree__item__controls {
    min-width: 0;
    display: none;
    flex: 0 0 auto;
    justify-content: flex-end;
    position: relative;
    padding: 0 ${({ theme }) => theme.sizes.spaces.df}px;
    align-items: center;
    flex-shrink: 0;
    display: flex;
    align-items: baseline;

    button {
      display: flex;
      padding: 0 ${({ theme }) => theme.sizes.spaces.xsm}px;
      font-size: inherit;
      margin: 0;
    }
  }

  .sidebar__tree__item__wrapper {
    width: 100%;
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    padding-left: ${({ depth }) => 18 + (depth as number) * 10}px;
  }

  a[href].sidebar__tree__item__label {
    cursor: pointer;
  }

  .sidebar__tree__item__label {
    font-size: ${({ theme }) => theme.sizes.fonts.md}px;
    display: flex;
    align-items: center;
    flex: 1 1 auto;
    background: none;
    outline: 0;
    border: 0;
    text-align: left;
    color: ${({ theme }) => theme.colors.text.primary};
    padding: 2px 0;
    text-decoration: none;
    margin: 0;
    overflow: hidden;
    svg {
      color: ${({ theme }) => theme.colors.text.link};
    }
    .sidebar__tree__item__label__ellipsis {
      padding-left: ${({ theme }) => theme.sizes.spaces.sm}px;
      padding-right: ${({ theme }) => theme.sizes.spaces.df}px;
      ${overflowEllipsis};
    }
  }

  .sidebar__tree__item__icon {
    flex: 0 0 auto;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }

  &:not(.sidebar__category) {
    font-size: ${({ theme }) => theme.sizes.fonts.df}px;
    &:active,
    &.sidebar__tree__item--active {
      background-color: ${({ theme }) => theme.colors.variants.primary.base};
      .sidebar__tree__item__label {
        color: ${({ theme }) => theme.colors.variants.primary.text};
      }
    }

    &:focus,
    &.focused {
      background-color: ${({ theme }) => theme.colors.background.tertiary};
    }

    &:hover {
      background-color: ${({ theme }) => theme.colors.background.quaternary};
    }

    &:hover .sidebar__tree__item__label,
    &:focus .sidebar__tree__item__label,
    &.focused .sidebar__tree__item__label {
      color: ${({ theme }) => theme.colors.text.primary};
    }
  }

  &.sidebar__category {
    .sidebar__tree__item__label {
    }

    border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
    .sidebar__tree__item__label {
      text-transform: uppercase !important;
    }

    &.focused {
      box-shadow: 0px 0px 0px 1px
        ${({ theme }) => theme.colors.variants.primary.base};
    }
    &:hover {
      box-shadow: 0px 0px 0px 1px
        ${({ theme }) => theme.colors.variants.primary.base};
    }
  }
`

export default NavigatorItem
