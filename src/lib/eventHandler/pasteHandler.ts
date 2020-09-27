import { IpcRenderer } from 'electron'
import isElectron from 'is-electron'

let ipcRenderer: IpcRenderer | null = null
if (window.require !== undefined) {
  // avoid for 'fs.existsSync is not a function'
  // see https://github.com/electron/electron/issues/7300#issuecomment-248773783
  ipcRenderer = window.require('electron').ipcRenderer
}

interface PasteInfo {
  doc: CodeMirror.Doc
  change: CodeMirror.EditorChange
  pastedText: string
}

interface FetchResult {
  contentType: string
  body: string
  isSuccess: boolean
}

let info: PasteInfo

const handlePasteText = (
  doc: CodeMirror.Doc,
  change: CodeMirror.EditorChange,
  pastedText: string
) => {
  doc.replaceRange(pastedText, change.from, {
    line: change.from.line,
    ch: change.from.ch + pastedText.length,
  })
}

const handlePasteUrl = async (doc: CodeMirror.Doc, change: CodeMirror.EditorChange, pastedText: string) => {
  if (ipcRenderer === null) return
  info = { doc, change, pastedText }

  const taggedUrl = `<${pastedText}>`
  const urlToFetch = pastedText

  doc.replaceRange(taggedUrl, change.from, {
    line: change.from.line,
    ch: change.from.ch + pastedText.length,
  })

  ipcRenderer.send('fetch-page-title-request', urlToFetch)
}

if (ipcRenderer !== null) {
  ipcRenderer.on('fetch-page-title-response', async (_, fetchResult: FetchResult) => {
    let replacement = info.pastedText
    if (fetchResult.contentType.toLowerCase().includes('text/html')) {
      replacement = mapNormalResponse(fetchResult.body)
    }
    info.doc.replaceRange(replacement, info.change.from, {
      line: info.change.from.line,
      ch: info.change.from.ch + info.pastedText.length + 2,
    })
  })
}

const mapNormalResponse = (body: string) => {
  try {
    const escapePipe = (str: string) => str.replace('|', '\\|')
    const parsedBody = new window.DOMParser().parseFromString(body, 'text/html')
    return `[${escapePipe(parsedBody.title)}](${info.pastedText})`
  } catch (e) {
    console.log(e)
  }
  return ''
}

export const codeMirrorPasteHandler = (
  editor: CodeMirror.Editor,
  change: CodeMirror.EditorChange,
  enableAutoFetchWebPageTitle: boolean
) => {
  if (!isElectron()) return
  if (!enableAutoFetchWebPageTitle) return
  const editorDoc = editor.getDoc()

  const isUrl = (str: string) => {
    return /(?:^\w+:|^)\/\/(?:[^\s\.]+\.\S{2}|localhost[\:?\d]*)/.test(str)
  }

  const isInLinkTag = (doc: CodeMirror.Doc) => {
    const startCursor = doc.getCursor('start')
    const prevChars = doc.getRange(
      {
        line: startCursor.line,
        ch: startCursor.ch - 2,
      },
      {
        line: startCursor.line,
        ch: startCursor.ch,
      }
    )
    const endCursor = doc.getCursor('end')
    const nextChar = doc.getRange(
      {
        line: endCursor.line,
        ch: endCursor.ch,
      },
      {
        line: endCursor.line,
        ch: endCursor.ch + 1,
      }
    )
    return prevChars === '](' && nextChar === ')'
  }

  const isInFencedCodeBlock = (editor: CodeMirror.Editor) => {
    const doc = editor.getDoc()
    const cursor = doc.getCursor()

    let token = editor.getTokenAt(cursor)
    if (token.state.fencedState) {
      return true
    }

    let line = cursor.line - 1
    while (line >= 0) {
      token = editor.getTokenAt({
        ch: 3,
        line,
      })

      if (token.start === token.end) {
        --line
      } else if (token.type === 'comment') {
        if (line > 0) {
          token = editor.getTokenAt({
            ch: 3,
            line: line - 1,
          })

          return token.type !== 'comment'
        } else {
          return true
        }
      } else {
        return false
      }
    }

    return false
  }

  const pastedText = change.text[0]
  if (isInFencedCodeBlock(editor)) {
    handlePasteText(editorDoc, change, pastedText)
  } else if (isUrl(pastedText) && !isInLinkTag(editorDoc)) {
    handlePasteUrl(editorDoc, change, pastedText)
  } else {
    handlePasteText(editorDoc, change, pastedText)
  }
}
