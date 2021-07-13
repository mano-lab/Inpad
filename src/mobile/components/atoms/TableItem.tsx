import React, { MouseEventHandler } from 'react'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'

interface TableItemProps {
  iconPath?: string
  label: React.ReactNode
  onClick?: MouseEventHandler<HTMLButtonElement>
}

const TableItem = ({ label, iconPath, onClick }: TableItemProps) => {
  return (
    <Container className='tableItem' onClick={onClick}>
      {iconPath != null && (
        <Icon size={20} className='tableItem__icon' path={iconPath} />
      )}
      <div className='tableItem__label'>{label}</div>
    </Container>
  )
}

export default TableItem

const Container = styled.button`
  height: 48px;
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.sizes.spaces.df}px;
  width: 100%;
  border: none;
  border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
  background-color: ${({ theme }) => theme.colors.background.secondary};
  color: ${({ theme }) => theme.colors.text.secondary};

  .tableItem__icon {
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
`
