import React, {
  useState,
  useRef,
  useMemo,
  MouseEvent,
  useCallback,
} from 'react'
import { FoldingProps } from '../../../../shared/components/atoms/FoldingWrapper'
import { MenuItem } from '../../../../shared/lib/stores/contextMenu'
import { ControlButtonProps } from '../../../../shared/lib/types'
import NavigatorItem from './NavigatorItem'
import cc from 'classcat'
import SidebarTreeForm from '../../../../shared/components/organisms/Sidebar/atoms/SidebarTreeForm'
import NavigatorNestedTreeRow from './NavigatorNestedTreeRow'
import {
  NavigatorControl,
  NavigatorRow,
} from '../../../lib/sidebar/useNavigatorTree'

interface NavigatorCategoryProps {
  label: string
  folded: boolean
  controls?: NavigatorControl[]
  hidden: boolean
  toggleHidden: () => void
  folding?: FoldingProps
  rows: NavigatorRow[]
  contextControls?: MenuItem[]
  footer?: React.ReactNode
  lastCategory?: boolean
}

const NavigatorCategory = ({
  category,
}: {
  category: NavigatorCategoryProps
}) => {
  const [creationFormIsOpened, setCreationFormIsOpened] = useState(false)
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
      (category.controls || []).map((control) => {
        return {
          icon: control.icon,
          disabled: control.disabled,
          onClick: (event: MouseEvent<HTMLButtonElement>) => {
            if (category.folded) {
              category.folding?.toggle()
            }
            control.onClick(event, openCreateForm)
          },
        }
      }) as ControlButtonProps[],
    [category.controls, category.folded, category.folding, openCreateForm]
  )

  return (
    <React.Fragment>
      <NavigatorItem
        className={cc([
          'sidebar__category',
          category.lastCategory && 'sidebar__category--last',
          !category.folded && 'sidebar__category--open',
        ])}
        isCategory={true}
        id={`category-${category.label}`}
        label={category.label}
        labelClick={category.folding?.toggle}
        folding={category.folding}
        folded={category.folded}
        controls={controls}
        contextControls={category.contextControls}
        depth={-1}
      />
      {!category.folded && (
        <div
          className={cc([
            'sidebar__category__items',
            creationFormIsOpened && `sidebar__category__items--silenced`,
          ])}
        >
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
          {category.rows.map((row) => (
            <NavigatorNestedTreeRow
              row={row}
              key={row.id}
              prefix={category.label}
              setCreationFormIsOpened={setCreationFormIsOpened}
            />
          ))}
          {category.footer}
        </div>
      )}
    </React.Fragment>
  )
}

export default NavigatorCategory
