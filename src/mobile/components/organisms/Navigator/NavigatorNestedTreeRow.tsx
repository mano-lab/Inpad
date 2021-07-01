import React, { useState, useRef, useMemo, useCallback } from 'react'
import NavigatorItem from './NavigatorItem'
import SidebarTreeForm from '../../../../shared/components/organisms/Sidebar/atoms/SidebarTreeForm'
import { NavigatorRow } from '../../../lib/sidebar/useNavigatorTree'

const NavigatorNestedTreeRow = ({
  row,
  prefix,
  setCreationFormIsOpened,
}: {
  row: NavigatorRow
  prefix?: string
  setCreationFormIsOpened: React.Dispatch<React.SetStateAction<boolean>>
}) => {
  const [showCreateForm, setShowCreateForm] = useState(false)
  const [placeholder, setPlaceholder] = useState('')
  const creationCallbackRef = useRef<((val: string) => Promise<void>) | null>(
    null
  )

  const openCreateForm = useCallback(
    async ({
      onSubmit,
      placeholder = '',
    }: {
      onSubmit: (value: string) => Promise<any>
      placeholder?: string
    }) => {
      setPlaceholder(placeholder)
      setCreationFormIsOpened(true)
      setShowCreateForm(true)
      creationCallbackRef.current = onSubmit
    },
    [setCreationFormIsOpened]
  )

  const controls = useMemo(
    () =>
      (row.controls || []).map((control) => {
        return {
          ...control,
          onClick: (event: React.MouseEvent<HTMLButtonElement>) => {
            control.onClick(event, openCreateForm)
          },
        }
      }),
    [row.controls, openCreateForm]
  )

  return (
    <div className='sidebar__drag__zone__wrapper'>
      <NavigatorItem
        key={row.id}
        id={`${prefix}-tree-item-${row.id}`}
        label={row.label}
        labelHref={row.href}
        labelClick={row.navigateTo}
        folding={row.folding}
        folded={row.folded}
        depth={row.depth}
        emoji={row.emoji}
        defaultIcon={row.defaultIcon}
        controls={controls}
        contextControls={row.contextControls}
        active={row.active}
      />
      {showCreateForm && (
        <SidebarTreeForm
          placeholder={placeholder}
          close={() => {
            setCreationFormIsOpened(false)
            setShowCreateForm(false)
          }}
          createCallback={creationCallbackRef.current}
        />
      )}
      {!row.folded &&
        (row.rows || []).map((child) => (
          <NavigatorNestedTreeRow
            row={child}
            key={`${prefix}-${child.id}`}
            prefix={prefix}
            setCreationFormIsOpened={setCreationFormIsOpened}
          />
        ))}
    </div>
  )
}

export default NavigatorNestedTreeRow
