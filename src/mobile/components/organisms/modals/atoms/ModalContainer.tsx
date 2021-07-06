import React from 'react'
import NavigationBarContainer from '../../../atoms/NavigationBarContainer'
import styled from '../../../../../shared/lib/styled'
import NavigationBarButton from '../../../atoms/NavigationBarButton'
import { useModal } from '../../../../../shared/lib/stores/modal'

interface ModalContainerProps {
  title: string
  closeLabel?: string

  left?: React.ReactNode
}

const ModalContainer: React.FC<ModalContainerProps> = ({
  title,
  children,
  closeLabel = 'Close',
  left,
}) => {
  const { closeLastModal } = useModal()
  return (
    <Container className='modal-container'>
      <div className='modal-container__header'>
        <NavigationBarContainer
          left={left}
          label={title}
          right={
            <NavigationBarButton onClick={closeLastModal}>
              {closeLabel}
            </NavigationBarButton>
          }
        />
      </div>
      <div className='modal-container__body'>{children}</div>
    </Container>
  )
}

export default ModalContainer

const zIndexModals = 8001

const Container = styled.div`
  &.modal-container {
    width: 100%;
    height: 100%;
    position: fixed;
    z-index: ${zIndexModals};
  }

  .modal-container__header {
    position: absolute;
    top: 0;
    left: 0;
    right: 0;
    height: 48px;
  }

  .modal-container__body {
    position: absolute;
    top: 48px;
    left: 0;
    right: 0;
    bottom: 0;
    overflow-y: auto;
    background-color: ${({ theme }) => theme.colors.background.secondary};
  }
`
