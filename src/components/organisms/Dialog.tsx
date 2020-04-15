import React from 'react'
import { useDialog } from '../../lib/dialog'
import DialogIcon from '../atoms/dialog/DialogIcon'
import PromptDialogBody from '../molecules/PromptDialogBody'
import { DialogTypes, DialogData } from '../../lib/dialog'
import { DialogContainer, DialogBackground } from '../atoms/dialog/styled'
import MessageBoxDialogBody from '../molecules/MessageBoxDialogBody'
import FolderConfigDialogBody from '../molecules/FolderConfigDialogBody'

export default () => {
  const { data, closeDialog } = useDialog()

  if (data == null) return null

  function renderBody(dialogData: DialogData) {
    switch (dialogData.type) {
      case DialogTypes.MessageBox:
        return (
          <MessageBoxDialogBody
            key={dialogData.id}
            data={dialogData}
            closeDialog={closeDialog}
          />
        )
      case DialogTypes.Prompt:
        return (
          <PromptDialogBody
            key={dialogData.id}
            data={dialogData}
            closeDialog={closeDialog}
          />
        )
      case DialogTypes.FolderConfig:
        return (
          <FolderConfigDialogBody
            key={dialogData.id}
            data={dialogData}
            closeDialog={closeDialog}
          />
        )
    }
    throw new Error('Invalid dialog type.')
  }

  return (
    <DialogBackground>
      <DialogContainer>
        <DialogIcon icon={data.iconType} />

        {renderBody(data)}
      </DialogContainer>
    </DialogBackground>
  )
}
