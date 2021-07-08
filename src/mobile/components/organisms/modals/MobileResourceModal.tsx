import React, { useRef, useState } from 'react'
import { useEffectOnce } from 'react-use'
import {
  ButtonProps,
  LoadingButton,
} from '../../../../shared/components/atoms/Button'
import Form from '../../../../shared/components/molecules/Form'
import { FormRowProps } from '../../../../shared/components/molecules/Form/templates/FormRow'
import styled from '../../../../shared/lib/styled'
import ModalContainer from './atoms/ModalContainer'
import MobileFormControl from '../../atoms/MobileFormControl'

interface MobileResourceModalProps {
  title: string
  prevRows?: FormRowProps[]
  defaultInputValue?: string
  placeholder: string
  defaultEmoji?: string
  defaultIcon: string
  inputIsDisabled?: boolean
  submitButtonProps: ButtonProps & {
    label: React.ReactNode
    spinning?: boolean
  }
  onSubmit: (input: string, emoji?: string) => void
}

const MobileResourceModal = ({
  title,
  defaultInputValue = '',
  defaultEmoji,
  defaultIcon,
  prevRows = [],
  placeholder,
  submitButtonProps,
  inputIsDisabled,
  onSubmit,
}: MobileResourceModalProps) => {
  const inputRef = useRef<HTMLInputElement>(null)
  const [value, setValue] = useState(defaultInputValue)
  const [emoji, setEmoji] = useState(defaultEmoji)

  useEffectOnce(() => {
    if (inputRef.current != null && !inputIsDisabled) {
      inputRef.current.focus()
    }
  })

  return (
    <ModalContainer title={title}>
      <Container>
        <div className='body'>
          <MobileFormControl>
            <Form
              rows={[
                ...prevRows,
                {
                  items: [
                    {
                      type: 'emoji',
                      props: {
                        defaultIcon,
                        emoji,
                        setEmoji,
                      },
                    },
                    {
                      type: 'input',
                      props: {
                        ref: inputRef,
                        disabled: inputIsDisabled,
                        placeholder,
                        value: value,
                        onChange: (event) => setValue(event.target.value),
                      },
                    },
                  ],
                },
              ]}
              onSubmit={() => onSubmit(value, emoji)}
            />
          </MobileFormControl>
          <MobileFormControl>
            <LoadingButton
              spinning={submitButtonProps.spinning}
              onClick={() => onSubmit(value, emoji)}
            >
              {submitButtonProps.label}
            </LoadingButton>
          </MobileFormControl>
        </div>
      </Container>
    </ModalContainer>
  )
}

export default MobileResourceModal

const Container = styled.div`
  .body {
    padding: ${({ theme }) => theme.sizes.spaces.md}px;
  }
`
