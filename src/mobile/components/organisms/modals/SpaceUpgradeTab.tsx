import React from 'react'
import styled from '../../../../shared/lib/styled'
import { useSet } from 'react-use'
import { usePage } from '../../../../cloud/lib/stores/pageStore'
import { PageStoreWithTeam } from '../../../../cloud/interfaces/pageStore'
import Icon from '../../../../shared/components/atoms/Icon'
import {
  mdiChevronRight,
  mdiCheck,
  mdiChevronDown,
  mdiArrowLeft,
} from '@mdi/js'
import Banner from '../../../../shared/components/atoms/Banner'
import { SettingsTabTypes } from './types'
import NavigationBarButton from '../../atoms/NavigationBarButton'
import ModalContainer from './atoms/ModalContainer'

type TabType = 'free' | 'standard' | 'pro'

interface SpaceUpgradeTabProps {
  setActiveTab: (tabType: SettingsTabTypes | null) => void
}

const SpaceUpgradeTab = ({ setActiveTab }: SpaceUpgradeTabProps) => {
  const { subscription, currentUserPermissions } = usePage<PageStoreWithTeam>()

  const [, { has: isTabOpen, toggle: toggleTab }] = useSet<TabType>()

  if (
    currentUserPermissions == null ||
    currentUserPermissions.role !== 'admin'
  ) {
    return (
      <Container>
        <Banner variant='danger'>Only Admin can change plan</Banner>
      </Container>
    )
  }

  return (
    <ModalContainer
      left={
        <NavigationBarButton onClick={() => setActiveTab(null)}>
          <Icon path={mdiArrowLeft} /> Back
        </NavigationBarButton>
      }
      title='Settings'
      closeLabel='Done'
    >
      <Container>
        <div className='planItem'>
          <div className='planItem__header'>
            <button
              className='planItem__header__titleButton'
              onClick={() => toggleTab('free')}
            >
              <Icon
                className='planItem__header__titleButton__foldIcon'
                path={isTabOpen('free') ? mdiChevronDown : mdiChevronRight}
              />
              Free
            </button>
            <button
              className='planItem__header__upgradeButton'
              disabled={subscription == null}
              onClick={() => setActiveTab('space-upgrade-confirm-free')}
            >
              {subscription == null ? 'Current' : 'Downgrade'}
            </button>
          </div>
          {isTabOpen('free') && (
            <div className='planItem__body'>
              <div className='planItem__body__price'>
                <span className='planItem__body__price__value'>$0</span>
              </div>
              <ul className='planItem__body__featureList'>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  10 docs per team
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Unlimited members
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  100MB storage per member
                </li>
              </ul>
              <a
                className='planItem__body__learnMoreButton'
                href='https://boostnote.io/pricing'
                target='_blank'
                rel='noopener noreferrer'
              >
                Learn more
              </a>
            </div>
          )}
        </div>
        <div className='planItem'>
          <div className='planItem__header'>
            <button
              className='planItem__header__titleButton'
              onClick={() => toggleTab('standard')}
            >
              <Icon
                className='planItem__header__titleButton__foldIcon'
                path={isTabOpen('standard') ? mdiChevronDown : mdiChevronRight}
              />
              Standard
            </button>
            <button
              className='planItem__header__upgradeButton'
              disabled={
                subscription != null && subscription.plan === 'standard'
              }
              onClick={() => setActiveTab('space-upgrade-confirm-standard')}
            >
              {subscription == null
                ? 'Upgrade'
                : subscription.plan === 'pro'
                ? 'Downgrade'
                : 'Current'}
            </button>
          </div>

          {isTabOpen('standard') && (
            <div className='planItem__body'>
              <div className='planItem__body__price'>
                <span className='planItem__body__price__value'>$3</span>
                <span className='planItem__body__price__unit'>
                  per person per month
                </span>
              </div>
              <ul className='planItem__body__featureList'>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Collaborative workspace
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Unlimited documents
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Unlimited members
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  1GB storage per member
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />7 days revision history
                </li>
              </ul>
              <a
                className='planItem__body__learnMoreButton'
                href='https://boostnote.io/pricing'
                target='_blank'
                rel='noopener noreferrer'
              >
                Learn more
              </a>
            </div>
          )}
        </div>
        <div className='planItem'>
          <div className='planItem__header'>
            <button
              className='planItem__header__titleButton'
              onClick={() => toggleTab('pro')}
            >
              <Icon
                className='planItem__header__titleButton__foldIcon'
                path={isTabOpen('pro') ? mdiChevronDown : mdiChevronRight}
              />
              Pro
            </button>
            <button
              className='planItem__header__upgradeButton'
              disabled={subscription != null && subscription.plan === 'pro'}
              onClick={() => setActiveTab('space-upgrade-confirm-pro')}
            >
              {subscription == null || subscription.plan === 'standard'
                ? 'Upgrade'
                : 'Current'}
            </button>
          </div>

          {isTabOpen('pro') && (
            <div className='planItem__body'>
              <div className='planItem__body__price'>
                <span className='planItem__body__price__value'>$8</span>
                <span className='planItem__body__price__unit'>
                  per person per month
                </span>
              </div>
              <ul className='planItem__body__featureList'>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Everything in Standard
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Guest invite
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Password/Expiration date for sharing
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  10GB storage per member
                </li>
                <li className='planItem__body__featureList__item'>
                  <Icon path={mdiCheck} />
                  Priority support
                </li>
              </ul>
              <a
                className='planItem__body__learnMoreButton'
                href='https://boostnote.io/pricing'
                target='_blank'
                rel='noopener noreferrer'
              >
                Learn more
              </a>
            </div>
          )}
        </div>
      </Container>
    </ModalContainer>
  )
}

export default SpaceUpgradeTab

const Container = styled.div`
  padding: ${({ theme }) => theme.sizes.spaces.sm}px 0;
  .planItem {
  }
  .planItem__header {
    height: 30px;
    display: flex;
    align-items: center;
    padding: 0 ${({ theme }) => theme.sizes.spaces.sm}px;
    width: 100%;
    border: none;
    border-bottom: solid 1px ${({ theme }) => theme.colors.border.main};
    background-color: ${({ theme }) => theme.colors.background.primary};
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  .planItem__header__titleButton {
    padding: 0;
    height: 30px;
    flex: 1;
    display: flex;
    align-items: center;
    border: none;
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text.secondary};
  }
  .planItem__header__titleButton__foldIcon {
    margin-right: ${({ theme }) => theme.sizes.spaces.xsm}px;
  }
  .planItem__header__upgradeButton {
    padding: 0;
    height: 30px;
    border: none;
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text.link};

    &:disabled {
      color: ${({ theme }) => theme.colors.text.disabled};
    }
  }

  .planItem__body {
    padding-bottom: ${({ theme }) => theme.sizes.spaces.sm}px;
  }
  .planItem__body__price {
    padding: ${({ theme }) => theme.sizes.spaces.sm}px
      ${({ theme }) => theme.sizes.spaces.sm}px;
  }
  .planItem__body__price__value {
    padding-right: ${({ theme }) => theme.sizes.spaces.sm}px;
    color: ${({ theme }) => theme.colors.text.primary};
    font-size: ${({ theme }) => theme.sizes.fonts.l}px;
    font-weight: bold;
  }
  .planItem__body__price__unit {
    color: ${({ theme }) => theme.colors.text.subtle};
    font-weight: bold;
  }
  .planItem__body__featureList {
    list-style: none;
    padding: 0;
    margin: 0;
  }
  .planItem__body__featureList__item {
    display: flex;
    align-items: center;
    padding: ${({ theme }) => theme.sizes.spaces.xsm}px
      ${({ theme }) => theme.sizes.spaces.sm}px;
  }
  .planItem__body__learnMoreButton {
    display: inline-block;
    padding: ${({ theme }) => theme.sizes.spaces.sm}px
      ${({ theme }) => theme.sizes.spaces.sm}px;
    border: none;
    background-color: transparent;
    color: ${({ theme }) => theme.colors.text.subtle};
    text-decoration: none;
  }
`
