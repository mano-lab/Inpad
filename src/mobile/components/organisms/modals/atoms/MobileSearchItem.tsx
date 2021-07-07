import React, { useCallback, useState } from 'react'
import styled from '../../../../../shared/lib/styled'
import { AppComponent } from '../../../../../shared/lib/types'
import cc from 'classcat'
import { overflowEllipsis } from '../../../../../shared/lib/styled/styleFunctions'
import Button from '../../../../../shared/components/atoms/Button'
import { mdiChevronDown, mdiChevronRight } from '@mdi/js'
import { Emoji } from 'emoji-mart'
import Icon from '../../../../../shared/components/atoms/Icon'
import FoldingWrapper, {
  FoldingProps,
} from '../../../../../shared/components/atoms/FoldingWrapper'
import { escapeRegExp } from '../../../../../lib/string'

interface MobileSearchItemProps {
  defaultIcon?: string
  depth?: number
  emoji?: string
  folded?: boolean
  folding?: FoldingProps
  id?: string
  label: string
  labelHref?: string
  highlighted?: string
  contexts?: string[]
  labelClick?: () => void
}

interface SharedProps {
  focused: boolean
  setFocused: React.Dispatch<boolean>
}

const MobileSearchItem: AppComponent<MobileSearchItemProps & SharedProps> = ({
  className,
  depth = 0,
  defaultIcon,
  emoji,
  focused,
  folding,
  folded,
  id,
  label,
  labelHref,
  highlighted,
  contexts,
  labelClick,
  setFocused,
}) => {
  const LabelTag = labelHref != null ? 'a' : 'button'
  const unfocusOnBlur = (event: any) => {
    if (
      document.activeElement == null ||
      !event.currentTarget.contains(event.relatedTarget)
    ) {
      setFocused(false)
    }
  }

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
      depth={depth}
      className={cc([
        className,
        'sidebar__search__item',
        focused && 'sidebar__search__item--focused',
        folded === false && 'sidebar__search__item--expanded',
      ])}
      onBlur={unfocusOnBlur}
    >
      <div className='sidebar__search__item__wrapper'>
        {folded != null && (
          <Button
            variant='icon'
            iconSize={16}
            iconPath={folded ? mdiChevronRight : mdiChevronDown}
            className='sidebar__search__item__icon'
            size='sm'
            onClick={folding?.toggle}
          />
        )}
        <LabelTag
          className='sidebar__search__item__label'
          onFocus={() => setFocused(true)}
          onClick={onClick}
          href={labelHref}
          id={`search-${id}`}
          tabIndex={1}
        >
          <div className='sidebar__search__item__main'>
            {emoji != null ? (
              <Emoji emoji={emoji} set='apple' size={16} />
            ) : defaultIcon != null ? (
              <Icon path={defaultIcon} size={16} />
            ) : null}
            <span className='sidebar__search__item__label__ellipsis'>
              {highlighted == null ? label : highlightMatch(label, highlighted)}
            </span>
          </div>
          {contexts != null && !folded && (
            <div className='sidebar__search__item__contexts'>
              {contexts.map((context, i) => (
                <div
                  className='sidebar__search__item__label__ellipsis'
                  key={`sidebar__search__item__${id}__contexts__${i}`}
                >
                  {highlighted == null
                    ? context
                    : highlightMatch(context, highlighted)}
                </div>
              ))}
            </div>
          )}
        </LabelTag>
      </div>
    </Container>
  )
}

function highlightMatch(label: string, highlight: string) {
  const parts = label.split(new RegExp(`(${escapeRegExp(highlight)})`, 'gi'))
  return (
    <span>
      {parts.map((part: string, i: number) =>
        part.toLowerCase() === highlight.toLowerCase() ? (
          <span className='sidebar__search__highlight' key={i}>
            {highlight}
          </span>
        ) : (
          part
        )
      )}
    </span>
  )
}

const Container = styled.div<{ depth: number }>`
  display: flex;
  width: 100%;
  flex-direction: row;
  justify-content: space-between;
  align-items: center;
  height: 30px;
  white-space: nowrap;
  font-size: ${({ theme }) => theme.sizes.fonts.df}px;
  border-radius: ${({ theme }) => theme.borders.radius}px;
  &:focus,
  &.sidebar__search__item--focused {
    background-color: ${({ theme }) => theme.colors.background.tertiary};
  }
  &:hover {
    background-color: ${({ theme }) => theme.colors.background.quaternary};
  }

  &.sidebar__search__item--expanded,
  &.sidebar__search__item--expanded .sidebar__search__item__wrapper {
    height: fit-content;
    align-items: flex-start;
  }

  .sidebar__search__item__wrapper {
    width: 100%;
    flex: 1 1 auto;
    display: flex;
    align-items: center;
    padding-left: ${({ depth }) => 26 + (depth as number) * 20}px;
  }

  a[href].sidebar__search__item__label {
    cursor: pointer;
  }

  .sidebar__search__item__label {
    font-size: ${({ theme }) => theme.sizes.fonts.df}px;
    display: flex;
    flex-direction: column;
    flex: 1 1 auto;
    background: none;
    outline: 0;
    border: 0;
    text-align: left;
    color: ${({ theme }) => theme.colors.text.primary};
    padding: ${({ theme }) => theme.sizes.spaces.xsm}px 0;
    text-decoration: none;
    margin: 0;
    overflow: hidden;
    svg {
      color: ${({ theme }) => theme.colors.text.link};
    }
    .sidebar__search__item__label__ellipsis {
      padding-left: ${({ theme }) => theme.sizes.spaces.xsm}px;
      ${overflowEllipsis};

      span {
        line-height: ${({ theme }) => theme.sizes.fonts.l}px;
      }
    }
  }

  .sidebar__search__item__main {
    display: flex;
    flex-direction: row;
    flex: 1 1 auto;
  }

  .sidebar__search__item__contexts {
    font-size: ${({ theme }) => theme.sizes.fonts.sm}px;
    color: ${({ theme }) => theme.colors.text.subtle};
  }

  .sidebar__search__highlight {
    color: ${({ theme }) => theme.sidebarSearchHighlightTextColor};
    background: ${({ theme }) => theme.sidebarSearchHighlightBackgroundColor};
  }

  .sidebar__search__item__icon {
    flex: 0 0 auto;
    padding-left: 0 !important;
    padding-right: 0 !important;
  }
`
const SidebarSearchItem: AppComponent<MobileSearchItemProps> = ({
  folding,
  ...props
}) => {
  const [focused, setFocused] = useState(false)
  if (folding != null) {
    return (
      <FoldingWrapper
        fold={folding.fold}
        unfold={folding.unfold}
        focused={focused}
      >
        <MobileSearchItem
          focused={focused}
          setFocused={setFocused}
          folding={folding}
          {...props}
        />
      </FoldingWrapper>
    )
  }
  return (
    <MobileSearchItem
      focused={focused}
      setFocused={setFocused}
      folding={folding}
      {...props}
    />
  )
}

export default SidebarSearchItem
