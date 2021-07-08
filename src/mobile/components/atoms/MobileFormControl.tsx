import styled from '../../../shared/lib/styled'

const MobileFormControl = styled.div`
  margin-bottom: ${({ theme }) => theme.sizes.spaces.df}px;
  label {
    display: block;
    width: 100%;
    margin-bottom: ${({ theme }) => theme.sizes.spaces.xsm}px;
    color: ${({ theme }) => theme.colors.text.subtle};
  }
  input[type='email'],
  input[type='password'],
  input[type='text'] {
    display: block;
    width: 100%;
    background-color: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.primary};
    border: solid 1px ${({ theme }) => theme.colors.border.main};
    height: 32px;
    padding: 0 ${({ theme }) => theme.sizes.spaces.df}px;
  }
  textarea {
    display: block;
    width: 100%;
  }

  button {
    display: block;
    width: 100%;
    .button__label {
      justify-content: center;
    }
  }
`

export default MobileFormControl
