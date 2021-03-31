import { openExternal, getWebContentsById } from '../electronOnly'
import { osName } from '../platform'

export function initHyperlink(CodeMirror) {
  const eventEmitter = {
    emit: function (eventType, href) {
      const webContents = getWebContentsById(1)
      if (webContents) {
        webContents.send(eventType, href)
      } else {
        console.log('[DEBUG]: No window for web contents id:1')
      }
    },
  }
  const yOffset = 2

  const macOS = osName === 'macos'
  const modifier = macOS ? 'metaKey' : 'ctrlKey'

  class HyperLink {
    constructor(cm) {
      this.cm = cm
      this.lineDiv = cm.display.lineDiv

      this.onMouseDown = this.onMouseDown.bind(this)
      this.onMouseEnter = this.onMouseEnter.bind(this)
      this.onMouseLeave = this.onMouseLeave.bind(this)
      this.onMouseMove = this.onMouseMove.bind(this)

      this.tooltip = document.createElement('div')
      this.tooltipContent = document.createElement('div')
      this.tooltipIndicator = document.createElement('div')
      this.tooltip.setAttribute(
        'class',
        'CodeMirror-hover CodeMirror-matchingbracket CodeMirror-selected'
      )
      this.tooltip.setAttribute('cm-ignore-events', 'true')
      this.tooltip.appendChild(this.tooltipContent)
      this.tooltip.appendChild(this.tooltipIndicator)
      this.tooltipContent.textContent = `${
        macOS ? 'Cmd(⌘)' : 'Ctrl(^)'
      } + click to follow link`

      this.lineDiv.addEventListener('mousedown', this.onMouseDown)
      this.lineDiv.addEventListener('mouseenter', this.onMouseEnter, {
        capture: true,
        passive: true,
      })
      this.lineDiv.addEventListener('mouseleave', this.onMouseLeave, {
        capture: true,
        passive: true,
      })
      this.lineDiv.addEventListener('mousemove', this.onMouseMove, {
        passive: true,
      })
    }

    getUrl(el) {
      const className = el.className.split(' ')
      if (className.indexOf('cm-url') !== -1) {
        // multiple cm-url because of search term
        const cmUrlSpans = Array.from(
          el.parentNode.getElementsByClassName('cm-url')
        )
        const textContent =
          cmUrlSpans.length > 1
            ? cmUrlSpans.map((span) => span.textContent).join('')
            : el.textContent

        const match = /^\((.*)\)|\[(.*)]|(.*)$/.exec(textContent)
        const url = match[1] || match[2] || match[3]
        return /^:storage(?:\/|%5C)/.test(url) ? null : url
      }

      return null
    }

    specialLinkHandler(e, rawHref, linkHash) {
      // This wil match shortId note id
      // :note:cs23_d12 up to :note:cs23_d122bgCol
      const regexIsNoteShortIdLink = /^:note:([a-zA-Z0-9_\-]{7,14})$/
      if (regexIsNoteShortIdLink.test(linkHash)) {
        eventEmitter.emit('note:navigate', linkHash.replace(':note:', ''))
        return true
      }

      return false
    }

    onMouseDown(e) {
      const { target } = e
      if (!e[modifier]) {
        return
      }

      // Create URL spans array used for special case "search term is hitting a link".
      const cmUrlSpans = Array.from(
        e.target.parentNode.getElementsByClassName('cm-url')
      )

      const innerText =
        cmUrlSpans.length > 1
          ? cmUrlSpans.map((span) => span.textContent).join('')
          : e.target.innerText
      const rawHref = innerText.trim().slice(1, -1) // get link text from markdown text

      if (!rawHref) return // not checked href because parser will create file://... string for [empty link]()

      const parser = document.createElement('a')
      parser.href = rawHref
      const { href, hash } = parser
      // needed because we're having special link formats that are removed by parser e.g. :line:10
      const linkHash = hash === '' ? rawHref : hash
      const foundUrl = this.specialLinkHandler(target, rawHref, linkHash)

      if (!foundUrl) {
        const url = this.getUrl(target)
        // all special cases handled --> other case
        if (url) {
          e.preventDefault()
          openExternal(url)
        }
      }
    }

    onMouseEnter(e) {
      const { target } = e

      const url = this.getUrl(target)
      if (url) {
        if (e[modifier]) {
          target.classList.add(
            'CodeMirror-activeline-background',
            'CodeMirror-hyperlink'
          )
        } else {
          target.classList.add('CodeMirror-activeline-background')
        }

        this.showInfo(target)
      }
    }

    onMouseLeave(e) {
      if (this.tooltip.parentElement === this.lineDiv) {
        e.target.classList.remove(
          'CodeMirror-activeline-background',
          'CodeMirror-hyperlink'
        )

        this.lineDiv.removeChild(this.tooltip)
      }
    }

    onMouseMove(e) {
      if (this.tooltip.parentElement === this.lineDiv) {
        if (e[modifier]) {
          e.target.classList.add('CodeMirror-hyperlink')
        } else {
          e.target.classList.remove('CodeMirror-hyperlink')
        }
      }
    }

    showInfo(relatedTo) {
      const b1 = relatedTo.getBoundingClientRect()
      const b2 = this.lineDiv.getBoundingClientRect()
      const tdiv = this.tooltip

      tdiv.style.left = b1.left - b2.left + 'px'
      this.lineDiv.appendChild(tdiv)

      const b3 = tdiv.getBoundingClientRect()
      const top = b1.top - b2.top - b3.height - yOffset
      if (top < 0) {
        tdiv.style.top = b1.top - b2.top + b1.height + yOffset + 'px'
      } else {
        tdiv.style.top = top + 'px'
      }
    }
  }

  CodeMirror.defineOption('hyperlink', true, (cm) => {
    const addon = new HyperLink(cm)
  })
}
