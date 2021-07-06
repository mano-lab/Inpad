import React, {
  DragEventHandler,
  FocusEventHandler,
  MouseEventHandler,
} from 'react'
import styled from '../../lib/styled'
import cc from 'classcat'

export interface HyperLinkProps {
  id?: string
  href: string
  className?: string
  tabIndex?: number
  onContextMenu?: MouseEventHandler
  onFocus?: FocusEventHandler
  draggable?: boolean
  onDragStart?: DragEventHandler
  onDrop?: DragEventHandler
  onDragOver?: DragEventHandler
  onClick?: MouseEventHandler
}

export const ExternalLink: React.FC<HyperLinkProps> = ({
  className,
  children,
  ...props
}) => (
  <Container
    className={cc(['link', className])}
    rel='noopener noreferrer'
    target='_blank'
    {...props}
  >
    {children}
  </Container>
)

const Link: React.FC<HyperLinkProps & { onClick: MouseEventHandler }> = ({
  className,
  children,
  ...props
}) => {
  return (
    <Container className={cc(['link', className])} {...props}>
      {children}
    </Container>
  )
}

export default Link

const Container = styled.a`
  display: inline;
  transition: 200ms color;
  text-decoration: none;
  color: ${({ theme }) => theme.colors.text.link};
  padding: 0 2px;
  cursor: pointer;

  &:hover {
    color: ${({ theme }) => theme.colors.text.link};
    text-decoration: underline;
  }

  &:focus {
    color: ${({ theme }) => theme.colors.text.link};
    opacity: 0.8;
  }
`
