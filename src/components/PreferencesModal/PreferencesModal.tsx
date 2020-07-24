import React, { useState, useMemo } from 'react'
import styled from '../../lib/styled'
import { usePreferences } from '../../lib/preferences'
import TabButton from './TabButton'
import { useGlobalKeyDownHandler } from '../../lib/keyboard'
import GeneralTab from './GeneralTab'
import EditorTab from './EditorTab'
import MarkdownTab from './MarkdownTab'
import AboutTab from './AboutTab'
import BillingTab from './BillingTab'
import ImportTab from './ImportTab'
import KeyBindingTab from './KeyBindingTab'

import {
  backgroundColor,
  closeIconColor,
} from '../../lib/styled/styleFunctions'
import { useTranslation } from 'react-i18next'
import Icon from '../atoms/Icon'
import { mdiClose } from '@mdi/js'

const Container = styled.div`
  z-index: 7000;
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  ${backgroundColor}
  display: flex;
  overflow: hidden;
`

const Header = styled.h1`
  margin: 0;
  padding: 1em 0;
`

const TabNav = styled.nav`
  width: 200px;
  margin-left: 30px;
`

const TabContent = styled.div`
  flex: 1;
  overflow-y: auto;
  padding-left: 4px;
  padding-top: 4em;
  padding-right: 30px;
`

const CloseButton = styled.button`
  position: absolute;
  top: 0;
  right: 12px;
  width: 40px;
  height: 40px;
  background-color: transparent;
  border: none;
  font-size: 24px;
  ${closeIconColor}
`

const PreferencesModal = () => {
  const { t } = useTranslation()
  const { closed, toggleClosed } = usePreferences()
  const [tab, setTab] = useState('general')

  const keydownHandler = useMemo(() => {
    return (event: KeyboardEvent) => {
      if (!closed && event.key === 'Escape') {
        toggleClosed()
      }
    }
  }, [closed, toggleClosed])
  useGlobalKeyDownHandler(keydownHandler)

  const content = useMemo(() => {
    switch (tab) {
      case 'editor':
        return <EditorTab />
      case 'markdown':
        return <MarkdownTab />
      case 'about':
        return <AboutTab />
      case 'billing':
        return <BillingTab />
      case 'import':
        return <ImportTab />
      case 'keybindings':
        return <KeyBindingTab />
      case 'general':
      default:
        return <GeneralTab />
    }
  }, [tab])

  if (closed) {
    return null
  }

  return (
    <Container>
      <TabNav>
        <Header>{t('preferences.general')}</Header>
        <TabButton
          label='General'
          tab='general'
          active={tab === 'general'}
          setTab={setTab}
        />
        <TabButton
          label='Editor'
          tab='editor'
          active={tab === 'editor'}
          setTab={setTab}
        />
        <TabButton
          label='Markdown'
          tab='markdown'
          active={tab === 'markdown'}
          setTab={setTab}
        />
        <TabButton
          label='Keybindings'
          tab='keybindings'
          active={tab === 'keybindings'}
          setTab={setTab}
        />
        <TabButton
          label='About'
          tab='about'
          active={tab === 'about'}
          setTab={setTab}
        />
        <TabButton
          label='Billing'
          tab='billing'
          active={tab === 'billing'}
          setTab={setTab}
        />
        <TabButton
          label='Import'
          tab='import'
          active={tab === 'import'}
          setTab={setTab}
        />
      </TabNav>
      <TabContent>{content}</TabContent>
      <CloseButton onClick={toggleClosed}>
        <Icon path={mdiClose} />
      </CloseButton>
    </Container>
  )
}

export default PreferencesModal
