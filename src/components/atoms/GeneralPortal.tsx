import React from 'react'
import ReactDOM from 'react-dom'

interface GeneralPortalProps {
  portalKey?: string
}

class GeneralPortal extends React.PureComponent<GeneralPortalProps> {
  private containerEl = document.createElement('div')
  constructor(props: GeneralPortalProps) {
    super(props)
  }

  componentDidMount() {
    document.body.appendChild(this.containerEl)
  }

  componentWillUnmount() {
    document.body.removeChild(this.containerEl)
  }

  render() {
    return ReactDOM.createPortal(
      this.props.children,
      this.containerEl,
      this.props.portalKey
    )
  }
}

export default GeneralPortal
