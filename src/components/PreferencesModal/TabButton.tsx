import React, { useCallback } from 'react'
import styled from '../../lib/styled'

interface TabButtonProps {
  label: string
  tab: string
  active: boolean
  setTab: (tab: string) => void
}

const StyledButton = styled.button`
  width: 100%;
  height: 30px;
  margin-bottom: 10px
  background-color: transparent;
  border: none;
  cursor: pointer;
  display: flex;
  align-items: center
  padding: 0;
  outline: none
  .border {
    width: 4px;
    height: 30px;
  }
  .label {
    margin-left: 15px;
    flex: 1;
    color: ${({ theme }) => theme.uiTextColor};
    text-align: left;
    font-size: 16px;
  }
  &.active {
    color: ${({ theme }) => theme.textColor};
    font-weight: bold;

    .border {
      background-color: ${({ theme }) => theme.primaryColor};
    }

    .label {
      color: ${({ theme }) => theme.textColor};
    }
  }
`

const TabButton = ({ label, tab, setTab, active }: TabButtonProps) => {
  const selectTab = useCallback(() => {
    setTab(tab)
  }, [tab, setTab])
  return (
    <StyledButton onClick={selectTab} className={active ? 'active' : ''}>
      <div className='border' />
      <div className='label'>{label}</div>
    </StyledButton>
  )
}

export default TabButton
