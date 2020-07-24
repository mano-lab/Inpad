import React, { useState, useEffect, KeyboardEvent, FocusEvent } from 'react'
import {
  Section,
  SectionHeader,
  SectionPrimaryButton,
  SectionInput,
  SectionTable,
  SectionSubtleText,
} from './styled'
import { usePreferences } from '../../lib/preferences'
import { useTranslation } from 'react-i18next'

interface Keybindings {
  [key: string]: string[];
}

const KeybindingsTab = () => {
  const { preferences, setPreferences } = usePreferences()
  const [errorMessage, setErrorMessage] = useState('')
  const [keybindings, setKeybindings] = useState({} as Keybindings)
  const { t } = useTranslation()

  let keybindingNames: string[] = []

  for (let option in preferences){
    let test = option.split('.')
    if (test[0] == 'keybinding'){
      keybindingNames.push(test[1])
    }
  }
  
  // populate locally stored keybindings
  useEffect(() => {
    const newState = {}
    keybindingNames.forEach((name) => {
      newState[name] = preferences['keybinding.' + name]
    })
    setKeybindings(newState)
  }, [])

  const KeyBindingInput = ({name} : {name: string}) => {
    return (
      <SectionInput
        label={name}
        onKeyDown={(e: KeyboardEvent<HTMLInputElement>) => {
          handleKeyDown(e, name)
        }}
        onKeyUp={(e: KeyboardEvent<HTMLInputElement>) => {
          handleKeyUp(e, name)
        }}
        value={(keybindings[name] || []).join(' + ')}
        onFocus={() => {
          keybindings[name] = []
          setKeybindings({...keybindings})
        }}
        readOnly={true}
      />
    )
  }

  const handleKeyDown = (e: KeyboardEvent<HTMLInputElement>, keybindingName: string) => {
    const keys = keybindings[keybindingName];
    if (!keys.includes(e.key)) {
      const newState = keybindings
      newState[keybindingName].push(e.key)
      setKeybindings({...newState})
    }
  }

  const handleKeyUp = (e: KeyboardEvent<HTMLInputElement>, label: string) => {
    const keys = keybindings[label];
    const lastKey = keys[keys.length - 1];
    if (lastKey == e.key && e.target) {
      (e.target as HTMLInputElement).blur()
    }
  }

  return (
    <div>
      <Section>
        <SectionHeader>Key Binding Settings</SectionHeader>
        <SectionPrimaryButton>Save</SectionPrimaryButton>
        <SectionSubtleText style={{ color: 'red' }}>
          {errorMessage}
        </SectionSubtleText>
        <SectionTable>
          <tbody>
            {keybindingNames.map((name, index) =>
              <tr key={index}>
                <td>{t('preferences.' + name)}</td>
                <td>
                  <KeyBindingInput name={name}/>
                </td>
              </tr>
            )}
          </tbody>
        </SectionTable>
      </Section>
    </div>
  )
}

export default KeybindingsTab
