import React, { useState, useCallback, useRef, useMemo } from 'react'
import Button from '../../../shared/components/atoms/Button'
import styled from '../../../shared/lib/styled'
import Flexbox from '../atoms/Flexbox'
import { useEffectOnce } from 'react-use'
import useSuggestions from '../../../shared/lib/hooks/useSuggestions'
import { SerializedUser } from '../../interfaces/db/user'
import UserIcon from '../atoms/UserIcon'
import {
  makeMentionElement,
  fromNode,
  toFragment,
  isMention,
} from '../../lib/comments'
import { useI18n } from '../../lib/hooks/useI18n'
import { lngKeys } from '../../lib/i18n/types'

interface CommentInputProps {
  onSubmit: (comment: string) => any
  value?: string
  autoFocus?: boolean
  users: SerializedUser[]
}

const smallUserIconStyle = { width: '20px', height: '20px', lineHeight: '17px' }
export function CommentInput({
  onSubmit,
  value = '',
  autoFocus = false,
  users,
}: CommentInputProps) {
  const [working, setWorking] = useState(false)
  const inputRef = useRef<HTMLDivElement>(null)
  const onSuggestionSelect = useRef((item: SerializedUser, hint: string) => {
    if (inputRef.current == null) {
      return
    }
    const { t } = useI18n()

    const selection = getSelection()
    if (selection == null) {
      return
    }
    const range = selection.getRangeAt(0)
    if (range == null) {
      return
    }
    range.setStart(range.startContainer, range.startOffset - hint.length - 1)
    range.setEnd(range.endContainer, range.endOffset)
    range.deleteContents()
    const mentionNode = makeMentionElement(item.id, item.displayName)
    range.insertNode(mentionNode)
    selection.removeAllRanges()
    selection.addRange(setRangeAfterCompat(new Range(), mentionNode))
  })

  const userSuggestions = useMemo(() => {
    return users.map((user) => ({
      key: user.displayName,
      item: user,
    }))
  }, [users])

  const {
    state,
    onKeyDownListener,
    onCompositionEndListener,
    closeSuggestions,
    setSelection,
    triggerAction,
  } = useSuggestions(userSuggestions, onSuggestionSelect.current)

  useEffectOnce(() => {
    if (inputRef.current) {
      inputRef.current.addEventListener('blur', closeSuggestions)
      if (value.length > 0) {
        inputRef.current.appendChild(toFragment(value))
      } else {
        resetInitialContent(inputRef.current)
      }
      if (autoFocus) {
        inputRef.current.focus()
      }
    }
  })

  const submit = useCallback(async () => {
    if (inputRef.current != null) {
      try {
        setWorking(true)
        await onSubmit(fromNode(inputRef.current).trim())
        if (inputRef.current != null) {
          resetInitialContent(inputRef.current)
          inputRef.current.focus()
        }
      } finally {
        setWorking(false)
      }
    }
  }, [onSubmit])

  const onKeyDown: React.KeyboardEventHandler<HTMLDivElement> = useCallback(
    (ev) => {
      onKeyDownListener(ev)

      if (ev.key === 'Enter' && (ev.ctrlKey || ev.metaKey)) {
        ev.preventDefault()
        ev.stopPropagation()
        submit()
        return
      }

      if (ev.key === 'Enter' && ev.shiftKey) {
        ev.preventDefault()
        ev.stopPropagation()
        return
      }

      if (ev.key === 'Backspace' || ev.key === 'Delete') {
        const mentionNode = getMentionInSelection()
        if (mentionNode != null) {
          mentionNode.parentNode?.removeChild(mentionNode)
        }
      }
    },
    [submit, onKeyDownListener]
  )

  const selectSuggestion: React.MouseEventHandler = useCallback(
    (ev) => {
      ev.stopPropagation()
      ev.preventDefault()
      triggerAction()
    },
    [triggerAction]
  )

  const beforeInputHandler: React.FormEventHandler = useCallback(() => {
    const mentionNode = getMentionInSelection()
    const selection = getSelection()
    if (mentionNode != null && selection != null) {
      const range = selection.getRangeAt(0)
      if (range.startOffset === 0) {
        setRangeBeforeCompat(range, mentionNode)
      } else {
        setRangeAfterCompat(range, mentionNode)
      }
      selection.removeAllRanges()
      selection.addRange(range)
    }
  }, [])

  return (
    <InputContainer>
      <div
        className='comment__input__editable'
        ref={inputRef}
        onKeyDown={onKeyDown}
        contentEditable={!working}
        onCompositionEnd={onCompositionEndListener}
        onClick={closeSuggestions}
        onBeforeInput={beforeInputHandler}
      ></div>
      <Flexbox justifyContent='flex-end'>
        <Button disabled={working} onClick={submit}>
          {t(lngKeys.ThreadPost)}
        </Button>
      </Flexbox>
      {state.type === 'enabled' && state.suggestions.length > 0 && (
        <div
          className='comment__input__suggestions'
          style={{
            top: `${state.position.bottom}px`,
          }}
        >
          {state.suggestions.map((user, i) => (
            <div
              key={user.id}
              className={
                user === state.selected
                  ? 'comment__input__suggestions--selected'
                  : ''
              }
              onMouseDown={selectSuggestion}
              onMouseEnter={() => setSelection(i)}
            >
              <UserIcon user={user} style={smallUserIconStyle} />{' '}
              <span>{user.displayName}</span>
            </div>
          ))}
        </div>
      )}
    </InputContainer>
  )
}

const InputContainer = styled.div`
  position: relative;
  width: 100%;
  & .comment__input__editable {
    white-space: pre-wrap;
    resize: none;
    width: 100%;
    border: 1px solid ${({ theme }) => theme.colors.border.second};
    min-height: 60px;
    background-color: ${({ theme }) => theme.colors.background.secondary};
    color: ${({ theme }) => theme.colors.text.primary};
    padding: 5px 10px;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.df}px;
  }

  & .comment__input__suggestions {
    position: fixed;
    right: 0;
    width: 400px;
    display: flex;
    flex-direction: column;
    border: 1px solid ${({ theme }) => theme.colors.border.second};
    background-color: ${({ theme }) => theme.colors.background.secondary};
    padding: ${({ theme }) => theme.sizes.spaces.sm}px 0;

    & > div {
      display: flex;
      padding: ${({ theme }) => theme.sizes.spaces.xsm}px;

      & > div {
        margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
      }

      &.comment__input__suggestions--selected {
        background-color: ${({ theme }) => theme.colors.background.tertiary};
      }
    }
  }
`

function resetInitialContent(element: Element) {
  for (let i = 0; i < element.childNodes.length; i++) {
    element.removeChild(element.childNodes[i])
  }

  const child = document.createElement('div')
  child.appendChild(document.createElement('br'))
  element.appendChild(child)
}

function getMentionInSelection() {
  const selection = getSelection()
  if (selection == null) return null
  const range = selection.getRangeAt(0)
  const elementNode =
    range.startContainer.nodeType === Node.TEXT_NODE
      ? range.startContainer.parentElement
      : range.startContainer
  return elementNode != null && isMention(elementNode) ? elementNode : null
}

function setRangeAfterCompat(range: Range, node: Node) {
  if (
    node.nextSibling != null &&
    node.nextSibling.textContent != null &&
    node.nextSibling.textContent.length > 0
  ) {
    range.selectNode(node.nextSibling)
    range.collapse(false)
    return range
  }

  range.setEndAfter(node)
  range.collapse(false)
  const textNode = document.createTextNode('\u00A0')
  range.insertNode(textNode)
  range.selectNodeContents(textNode)
  range.collapse(false)
  return range
}

function setRangeBeforeCompat(range: Range, node: Node) {
  if (
    node.previousSibling != null &&
    node.previousSibling.textContent != null &&
    node.previousSibling.textContent.length > 0
  ) {
    range.selectNode(node.previousSibling)
    range.collapse(true)
    return range
  }

  if (node.parentNode != null) {
    const textNode = document.createTextNode('\u00A0')
    node.parentNode.insertBefore(textNode, node)
    range.selectNodeContents(textNode)
    range.collapse(true)
  }
  return range
}

export default CommentInput
