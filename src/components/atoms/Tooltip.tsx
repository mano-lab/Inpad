import React from 'react'
import GeneralPortal from './GeneralPortal'
import styled from '../../lib/styled/styled'
import { BaseTheme } from '../../lib/styled/BaseTheme'

interface TooltipProps {
  text?: string
  width?: number
  arrowWidth?: number
  space?: number
  tooltipDelayMs?: number
}

interface TooltipStyle {
  width: number | string
  left?: number | string
  top?: number | string
  bottom?: number | string
}

interface TooltipArrowStyle {
  width: number | string
  left?: number | string
  top?: number | string
  bottom?: number | string
  transform?: string
  display?: string
}

interface TooltipState {
  visible: boolean
  style?: TooltipStyle
  arrowStyle?: TooltipArrowStyle
}

interface TooltipBodyProps {
  theme: BaseTheme
  arrowStyle: TooltipArrowStyle
}

const TooltipBody = styled.div<BaseTheme & TooltipBodyProps>`
  position: fixed;
  padding: 5px;
  background: ${({ theme }) => theme.tooltipBackgroundColor};
  color: white;
  box-shadow: 2px 2px 3px rgba(0, 0, 0, 0.3);
  text-align: center;
  font-size: 11px;
  border-radius: 6px;
  z-index: 6000;

  &::after {
    display: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.display};
    content: '';
    position: absolute;
    bottom: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.bottom};
    top: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.top};
    left: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.left};
    transform: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.transform};
    margin-left: ${({ arrowStyle }: TooltipBodyProps) => -arrowStyle.width}px;
    border-width: ${({ arrowStyle }: TooltipBodyProps) => arrowStyle.width}px;
    border-style: solid;
    border-color: transparent transparent
      ${({ theme }) => theme.tooltipBackgroundColor} transparent;
  }
`

const TooltipContainer = styled.span`
  //border-bottom: 1px dashed grey;
`

const DEFAULT_TOOLTIP_DELAY_MS = 500

class Tooltip extends React.Component<TooltipProps, TooltipState> {
  private readonly width: number
  private readonly arrowWidth: number
  private readonly space: number
  private readonly tooltipDelayMs: number
  private showTooltipTimer: any | null
  tooltipContainerRef = React.createRef<HTMLSpanElement>()
  tooltipRef = React.createRef<HTMLSpanElement>()
  constructor(props: TooltipProps) {
    super(props)

    this.state = {
      visible: false,
      arrowStyle: {
        width: '5px',
      },
    }

    this.arrowWidth = props.arrowWidth || 6
    this.width = props.width || 120
    this.space = props.space || 4
    this.tooltipDelayMs = props.tooltipDelayMs || DEFAULT_TOOLTIP_DELAY_MS

    this.showTooltip = this.showTooltip.bind(this)
    this.hideTooltip = this.hideTooltip.bind(this)
  }

  showTooltip() {
    if (!this.tooltipContainerRef.current) return
    const style: TooltipStyle = {
      width: `${this.width}px`,
    }
    const arrowStyle: TooltipArrowStyle = {
      width: `${this.arrowWidth}`,
    }
    const dimensions = this.tooltipContainerRef.current.getBoundingClientRect()

    style.left = dimensions.left + dimensions.width / 2 - this.width / 2
    arrowStyle.left = '50%'

    // this.space might better be of width size not height offset like now
    const leftMargin = document.body.clientWidth - this.width - this.space
    if (style.left > leftMargin) {
      // we could decide to not show arrow when not in center
      // or use below logic to position it at the center of element which tooltip is shown
      // arrowStyle.display = 'none'
      let newLeftPosition = Math.max(this.space, style.left)
      newLeftPosition = Math.min(newLeftPosition, leftMargin)
      arrowStyle.left = `${
        Math.abs(dimensions.left - newLeftPosition) + dimensions.width / 2
      }px`
    } else {
      arrowStyle.display = 'block'
    }

    style.left = Math.max(this.space, style.left)
    style.left = Math.min(style.left, leftMargin)

    const topOfThePagePercent = 0.9
    if (dimensions.top < topOfThePagePercent * window.innerHeight) {
      style.top = dimensions.top + dimensions.height + this.space
      if (this.state.arrowStyle) {
        arrowStyle.bottom = '100%'
        arrowStyle.top = 'auto'
      }
    } else {
      style.bottom = window.innerHeight - dimensions.top + this.space
      if (this.state.arrowStyle) {
        arrowStyle.top = '100%'
        arrowStyle.bottom = 'auto'
        arrowStyle.transform = 'rotate(180deg)'
      }
    }

    this.setState({
      visible: true,
      style,
      arrowStyle,
    })
  }

  hideTooltip() {
    clearTimeout(this.showTooltipTimer)
    this.setState({ visible: false })
  }

  render() {
    return (
      <TooltipContainer
        onMouseOver={() => {
          this.showTooltipTimer = setTimeout(
            this.showTooltip,
            this.tooltipDelayMs
          )
        }}
        onMouseOut={this.hideTooltip}
        ref={this.tooltipContainerRef}
      >
        {this.props.children}

        {this.state.visible && this.props.text && (
          <GeneralPortal>
            <TooltipBody
              arrowStyle={this.state.arrowStyle}
              style={this.state.style}
            >
              {this.props.text}
            </TooltipBody>
          </GeneralPortal>
        )}
      </TooltipContainer>
    )
  }
}

export default Tooltip
