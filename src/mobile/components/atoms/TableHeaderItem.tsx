import React from 'react'
import styled from '../../../shared/lib/styled'
import Icon from '../../../shared/components/atoms/Icon'

interface TableHeaderItemProps {
  iconPath?: string
  label: string
}

const TableHeaderItem = ({ label, iconPath }: TableHeaderItemProps) => {
  return (
    <Container className='tableHeaderItem'>
      {iconPath != null && (
        <Icon className='tableHeaderItem__icon' path={iconPath} />
      )}
      <div className='tableHeaderItem__label'>{label}</div>
    </Container>
  )
}

export default TableHeaderItem

const Container = styled.button`
  height: 30px;
  display: flex;
  align-items: center;
  padding: 0 ${({ theme }) => theme.sizes.spaces.df}px;
  width: 100%;
  border: none;
  border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
  background-color: ${({ theme }) => theme.colors.background.primary};
  color: ${({ theme }) => theme.colors.text.secondary};

  .tableHeaderItem__icon {
    margin-right: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
`
