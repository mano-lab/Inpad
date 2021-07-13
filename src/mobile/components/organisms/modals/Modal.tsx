import React from 'react'
import { useModal } from '../../../../shared/lib/stores/modal'
import { usePathnameChangeEffect } from '../../../../cloud/lib/router'

const Modal = () => {
  const { modals, closeAllModals } = useModal()
  usePathnameChangeEffect(closeAllModals)

  if (modals.length === 0) return null

  return (
    <>
      {modals.map((modal, i) => (
        <React.Fragment key={`modal-${i}`}>{modal.content}</React.Fragment>
      ))}
    </>
  )
}

export default Modal
