import CodeMirror from 'codemirror'
import 'codemirror/addon/runmode/runmode'
import 'codemirror/addon/mode/overlay'
import 'codemirror/addon/comment/comment'
import 'codemirror/addon/edit/continuelist'
import 'codemirror/addon/dialog/dialog'
import 'codemirror/addon/scroll/scrollpastend'
import 'codemirror/addon/search/search'
import 'codemirror/addon/search/searchcursor'
import 'codemirror/addon/search/jump-to-line'
import 'codemirror/addon/dialog/dialog.css'
import 'codemirror/mode/markdown/markdown'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/mode/xml/xml'
import 'codemirror/mode/css/css'
import debounce from 'lodash/debounce'
import 'codemirror/lib/codemirror.css'
import 'codemirror/keymap/sublime'
import 'codemirror/keymap/emacs'
import 'codemirror/keymap/vim'
import 'codemirror-abap'

// Custom addons
import { initHyperlink } from './addons/hyperlink'

const dispatchModeLoad = debounce(() => {
  window.dispatchEvent(new CustomEvent('codemirror-mode-load'))
}, 300)

export async function requireMode(mode: string) {
  try {
    await import(`codemirror/mode/${mode}/${mode}.js`)
    dispatchModeLoad()
  } catch (error) {
    console.warn(error)
  }
}

export function getCodeMirrorTheme(theme?: string) {
  if (theme == null) return 'default'
  if (theme === 'solarized-dark') return 'solarized dark'
  return theme
}

function loadMode(_CodeMirror: any) {
  const memoizedModeResult = new Map<string, CodeMirror.ModeInfo | null>()
  function findModeByMIME(mime: string) {
    let result = memoizedModeResult.get(mime)
    if (result === undefined) {
      result = CodeMirror.findModeByMIME(mime) || null
      memoizedModeResult.set(mime, result)
    }
    return result
  }

  const originalGetMode = CodeMirror.getMode
  _CodeMirror.getMode = (config: CodeMirror.EditorConfiguration, mime: any) => {
    const modeObj = originalGetMode(config, mime)
    if (modeObj.name === 'null' && typeof mime === 'string') {
      const mode = findModeByMIME(mime)
      if (mode != null) {
        requireMode(mode.mode)
      }
    }
    return modeObj
  }
}

// Initialize custom addons
initHyperlink(CodeMirror)
loadMode(CodeMirror)

export default CodeMirror

export const themes = [
  '3024-day',
  'base16-light',
  'dracula',
  'gruvbox-dark',
  'liquibyte',
  'mbo',
  'neo',
  'paraiso-light',
  'solarized',
  'solarized-dark',
  'twilight',
  'zenburn',
  '3024-night',
  'bespin',
  'duotone-dark',
  'hopscotch',
  'lucario',
  'mdn-like',
  'night',
  'pastel-on-dark',
  'ssms',
  'vibrant-ink',
  'abcdef',
  'blackboard',
  'duotone-light',
  'icecoder',
  'material',
  'midnight',
  'nord',
  'railscasts',
  'the-matrix',
  'xq-dark',
  'ambiance',
  'cobalt',
  'eclipse',
  'idea',
  'material-darker',
  'monokai',
  'oceanic-next',
  'rubyblue',
  'tomorrow-night-bright',
  'xq-light',
  'ambiance-mobile',
  'colorforth',
  'elegant',
  'isotope',
  'material-ocean',
  'moxer',
  'panda-syntax',
  'seti',
  'tomorrow-night-eighties',
  'yeti',
  'base16-dark',
  'darcula',
  'erlang-dark',
  'lesser-dark',
  'material-palenight',
  'neat',
  'paraiso-dark',
  'shadowfox',
  'ttcn',
  'yonce',
].sort()

export interface EditorPosition {
  line: number
  ch: number
}
