import styled from '../../../../lib/styled'
import {
  linkText,
  borderedInputStyle,
} from '../../../../lib/styled/styleFunctions'

export const ModalContainer = styled.div`
  width: 100%;
  padding: ${({ theme }) => theme.space.default}px
    ${({ theme }) => theme.space.xxlarge}px;
  background-color: ${({ theme }) => theme.baseBackgroundColor};
  overflow: hidden auto;
  color: ${({ theme }) => theme.emphasizedTextColor};
  height: 100%;
  img {
    max-width: 100%;
  }

  h4 {
    border-left: 4px solid;
    padding-left: 10px;
  }

  p {
    color: ${({ theme }) => theme.baseTextColor};
    text-align: left;
  }

  span.shortcut-key {
    border: 2px solid ${({ theme }) => theme.subtleTextColor};
    margin-right: 5px;
    padding: 5px 7px;
    border-radius: 3px;
  }
`

export const ModalInner = styled.div`
  display: flex;
  align-items: center;
  height: 100%;
`

export const ModalContent = styled.div`
  margin: 0 auto;
  text-align: center;
`

export const ModalSection = styled.div`
  display: flex;
  flex-direction: column;
  margin-top: ${({ theme }) => theme.space.medium}px;
  width: 100%;
  &.justify-end {
    justify-content: flex-end;
  }
  &.direction-row {
    flex-direction: row;
  }
`

export const ModalHeader = styled.h1`
  margin-top: ${({ theme }) => theme.space.xsmall}px;
  margin-bottom: ${({ theme }) => theme.space.xsmall}px;
`

export const ModalBody = styled.div`
  margin-top: ${({ theme }) => theme.space.medium}px;

  p {
    max-width: 600px;
    line-height: 28px;
  }
  button {
    margin-top: ${({ theme }) => theme.space.default}px;
  }
`

export const ModalLine = styled.div`
  display: flex;
  align-items: center;

  &.column {
    flex-direction: column;
  }

  &:not(.svg-initial-style) {
    svg {
      font-size: 48px;
      margin-right: ${({ theme }) => theme.space.medium}px;
      color: ${({ theme }) => theme.primaryTextColor};
    }
  }

  &.justify-end {
    justify-content: flex-end;
  }

  &.justify-center {
    justify-content: center;
  }

  &.scrollable {
    margin: 0;
    overflow: hidden auto;
    flex-grow: 1;
  }

  .spacer-sm {
    width: ${({ theme }) => theme.space.small}px;
  }
`

export const ModaLineHeader = styled.h3`
  margin-top: 0;
  margin-bottom: ${({ theme }) => theme.space.small}px;
  font-size: ${({ theme }) => theme.fontSizes.medium}px;
`

export const ModalLabel = styled.label`
  display: block;
  margin-bottom: ${({ theme }) => theme.space.xsmall}px;
`

export const ModalText = styled.div`
  display: flex;
  flex-direction: column;
  color: ${({ theme }) => theme.subtleTextColor};
  text-align: left;

  a {
    padding-left: 2px;
    ${linkText}
  }
`

export const ModalEmphasizedText = styled.h3`
  color: ${({ theme }) => theme.emphasizedTextColor};
  margin: 0;
  font-style: italic;
`

export const ModalScrollable = styled.div`
  ${borderedInputStyle}
  width: 100%;
  margin: 0;
  overflow: hidden auto;
  max-height: calc(100% - ${({ theme }) => theme.topHeaderHeight}px);
  flex-grow: 1;
`

export const ModalTable = styled.table`
  border-collapse: collapse;
  width: 100%;
  margin-bottom: ${({ theme }) => theme.space.medium}px;

  tr {
    border-bottom: 1px solid ${({ theme }) => theme.subtleBorderColor};
    width: 100%;
  }

  td {
    padding: ${({ theme }) => theme.space.xsmall}px 0;
    color: ${({ theme }) => theme.baseTextColor};
    font-weight: normal;
  }

  td.shortcut-key-table {
    font-weight: 500;
    width: 150px;
    text-align: right;
    padding: ${({ theme }) => theme.space.xsmall}px 0;
    color: ${({ theme }) => theme.emphasizedTextColor};
  }

  sup {
    margin-left: 3px;
  }
`
export const SectionHeader2 = styled.h2`
  margin: ${({ theme }) => theme.space.medium}px 0
    ${({ theme }) => theme.space.default}px;
  font-size: ${({ theme }) => theme.fontSizes.medium}px;
  font-weight: 500;
`
