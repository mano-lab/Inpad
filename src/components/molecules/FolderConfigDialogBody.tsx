import React, { ChangeEventHandler, KeyboardEventHandler } from 'react'
import {
  FolderConfigDialogValues,
  FolderConfigDialogOptions,
} from '../../lib/dialog'
import {
  DialogBodyContainer,
  DialogTitle,
  DialogMessage,
  DialogPromptInput,
  DialogButtonGroup,
  DialogButton,
} from '../atoms/dialog/styled'
import DialogColorPicker from '../atoms/dialog/DialogColorPicker'

type FolderConfigDialogProps = {
  data: FolderConfigDialogOptions
  closeDialog: () => void
}

type FolderConfigDialogState = FolderConfigDialogValues

export default class FolderConfigDialogBody extends React.Component<
  FolderConfigDialogProps,
  FolderConfigDialogState
> {
  state = this.props.data.defaultValue || { color: '' }
  inputRef = React.createRef<HTMLInputElement>()

  componentDidMount() {
    if (this.state.folderPath === undefined) {
      return
    }
    this.inputRef.current!.focus()
  }

  updateInputValue: ChangeEventHandler<HTMLInputElement> = (event) => {
    this.setState({
      folderPath: event.target.value,
    })
  }

  updateColorValue = (color: string) => {
    this.setState({ color })
  }

  handleBodyKeyDown: KeyboardEventHandler<HTMLDivElement> = (event) => {
    switch (event.key) {
      case 'Escape':
        this.cancel()
        return
    }
  }

  handleInputKeyDown: KeyboardEventHandler<HTMLInputElement> = (event) => {
    switch (event.key) {
      case 'Enter':
        this.submit()
        return
    }
  }

  submit = () => {
    const { data, closeDialog } = this.props
    closeDialog()
    data.onClose(this.state)
  }

  cancel = () => {
    const { data, closeDialog } = this.props
    closeDialog()
    data.onClose(null)
  }

  render() {
    const { data } = this.props
    return (
      <DialogBodyContainer onKeyDown={this.handleBodyKeyDown}>
        <DialogTitle>{data.title}</DialogTitle>
        <DialogMessage>{data.message}</DialogMessage>
        {this.state.folderPath !== undefined ? (
          <DialogPromptInput
            ref={this.inputRef}
            value={this.state.folderPath}
            onChange={this.updateInputValue}
            onKeyDown={this.handleInputKeyDown}
          />
        ) : null}
        <DialogColorPicker
          color={this.state.color}
          handleChangeComplete={this.updateColorValue}
        />
        <DialogButtonGroup>
          <DialogButton onClick={this.submit}>
            {data.submitButtonLabel == null ? 'Submit' : data.submitButtonLabel}
          </DialogButton>
          <DialogButton onClick={this.cancel}>
            {data.cancelButtonLabel == null ? 'Cancel' : data.cancelButtonLabel}
          </DialogButton>
        </DialogButtonGroup>
      </DialogBodyContainer>
    )
  }
}
