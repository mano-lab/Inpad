import styled from '../../../lib/styled'
import {
  border,
  backgroundColor,
  inputStyle,
  secondaryButtonStyle,
} from '../../../lib/styled/styleFunctions'
import { getColorBrighness } from '../../../lib/colors'

const dialogZIndex = 8000

export const DialogBackground = styled.div`
  position: fixed;
  left: 0;
  right: 0;
  top: 0;
  bottom: 0;
  z-index: ${dialogZIndex};
  display: flex;
  background-color: rgba(0, 0, 0, 0.4);
  justify-content: center;
  align-items: flex-start;
`

export const DialogContainer = styled.div`
  width: 100%;
  max-width: 450px;
  ${backgroundColor}
  ${border}
  border-style: solid;
  padding: 20px;
  border-width: 0 1px 1px 1px;
  font-size: 14px;
  box-sizing: border-box;
  border-radius: 0 0 5px 5px;
  box-shadow: 0px 8px 15px rgba(0, 0, 0, 0.35);
  outline: none;
  display: flex;
`

export const DialogBodyContainer = styled.div`
  flex: 1;
`

export const DialogTitle = styled.h1`
  margin: 0 0 10px;
  padding: 0;
  font-size: 14px;
`

export const DialogMessage = styled.p`
  margin: 0;
  padding: 0;
  font-size: 12px;
  margin-bottom: 20px;
`

export const DialogPromptInput = styled.input`
  width: 100%;
  margin-bottom: 15px;
  height: 32px;
  outline: none;
  padding: 0 8px;
  ${inputStyle}
`

export const DialogButtonGroup = styled.div`
  width: 100%;
  display: flex;
  flex-flow: row-reverse;
`

export const DialogButton = styled.button`
  padding: 5px 10px;
  border-radius: 2px;
  margin-left: 8px;
  user-select: none;
  ${secondaryButtonStyle}
`
export const DialogColorPickerContainer = styled.div`
  display: flex;
  margin-top: -7px;
  margin-bottom: 15px;
  height: 32px;
`

export const DialogColorMessage = styled.p`
  margin: auto 0;
`

export const DialogColorPickerButton = styled.button`
  width: 64px;
  margin-left: 8px;
  border: none;
  border-radius: 2px;
  background-color: rgba(0, 0, 0, 0.12);
  display: inline-block;
  cursor: pointer;
`

export const DialogColorPreview = styled.div`
  display: flex;
  justify-content: center;
  align-items: center;
  height: 32px;
  border-radius: 2px;
  color: ${({ theme }) =>
    getColorBrighness(theme.backgroundColor) > 125 ? 'black' : 'white'};
`

export const DialogColorIndicator = styled.p`
  margin: auto;
`

export const DialogColorPickerPopover = styled.div`
  position: absolute;
  z-index: 2;
  .sketch-picker {
    margin-top: 42px;
  }
`

export const DialogColorPickerCover = styled.div`
  padding-top: 32px;
  position: fixed;
  top: 0px;
  right: 0px;
  bottom: 0px;
  left: 0px;
`
