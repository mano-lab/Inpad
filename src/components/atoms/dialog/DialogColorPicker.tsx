import React from 'react'
import { SketchPicker, ColorResult } from 'react-color'
import {
  DialogButton,
  DialogColorPickerButton,
  DialogColorPreview,
  DialogColorPickerPopover,
  DialogColorPickerCover,
  DialogColorPickerContainer,
  DialogColorIndicator,
  DialogColorMessage,
} from './styled'
import { getColorBrighness } from '../../../lib/colors'

type ColorPickerProps = {
  color: string
  handleChangeComplete: (color: string) => void
}

type ColorPickerStates = {
  color: string
  colorBrightness: number
  displayColorPicker: boolean
}

export default class DialogColorPicker extends React.Component<
  ColorPickerProps,
  ColorPickerStates
> {
  state = {
    color: this.props.color,
    colorBrightness: getColorBrighness(this.props.color),
    displayColorPicker: false,
  }

  resetColor = () => {
    this.setState({ color: '', colorBrightness: 0 })
    this.props.handleChangeComplete('')
  }

  handleClick = () => {
    this.setState({ displayColorPicker: !this.state.displayColorPicker })
  }

  handleClose = () => {
    this.setState({ displayColorPicker: false })
    this.props.handleChangeComplete(this.state.color)
  }

  handleChange = (color: ColorResult) => {
    this.setState({
      color: color.hex,
      colorBrightness: getColorBrighness(color.rgb),
    })
  }

  render() {
    return (
      <DialogColorPickerContainer>
        <DialogColorMessage>Choose a color:</DialogColorMessage>
        <DialogColorPickerButton onClick={this.handleClick}>
          <DialogColorPreview style={{ backgroundColor: this.state.color }}>
            <DialogColorIndicator
              style={{
                color: this.state.color
                  ? this.state.colorBrightness > 125
                    ? 'black'
                    : 'white'
                  : '',
              }}
            >
              {this.state.color || 'default'}
            </DialogColorIndicator>
          </DialogColorPreview>
        </DialogColorPickerButton>
        <DialogButton
          style={{
            marginLeft: '32px',
            marginTop: 'auto',
            marginBottom: 'auto',
          }}
          onClick={this.resetColor}
        >
          Reset
        </DialogButton>
        {this.state.displayColorPicker ? (
          <DialogColorPickerPopover>
            <DialogColorPickerCover onClick={this.handleClose} />
            <SketchPicker
              disableAlpha={true}
              color={this.state.color}
              onChange={this.handleChange}
            />
          </DialogColorPickerPopover>
        ) : null}
      </DialogColorPickerContainer>
    )
  }
}
