import { render } from 'react-dom'
import { h } from '../view'
import { $ } from '../util'
import load from '../data/load'
import CodeMirror from 'codemirror'
import 'codemirror/lib/codemirror.css'
import 'codemirror/mode/gfm/gfm'
import 'codemirror/keymap/sublime'
import 'codemirror/theme/base16-dark.css'
import 'codemirror/addon/edit/continuelist'
import 'codemirror/addon/edit/closebrackets.js'
import 'codemirror/addon/selection/active-line.js'

let cancelEscOnce = 0
let action = {
  focus() {
    cm.focus()
  },
  blur(a, b) {
    document.activeElement.blur()
    cancelEscOnce = 1
  },
  open_last() {
    if (cancelEscOnce === 1) cancelEscOnce = 0
    else return ['open', 'lastApp']
  }
}
export default {
  view,
  open,
  action,
  nmap: {
    i: ['focus'],
    esc: ['open_last']
  }
}

let local, item, cm
function view() {}
function open(id) {
  load(l => {
    local = l
    item = l.get(id)
    function onChange() {
      item.name = $('#name').value
      local.update(item)
    }
    render(
      h('div pa3 h-100', [
        'div shadow border-box h-100',
        { width: '37em', margin: 'auto' },
        [
          'input bg-transparent white b pa2 w-100',
          { id: 'name', onChange, defaultValue: item.name }
        ],
        ['textarea', { defaultValue: item.notion }]
      ]),
      document.getElementById('root')
    )
    cm = CodeMirror.fromTextArea($('textarea'), {
      mode: 'gfm',
      keyMap: 'sublime',
      theme: 'base16-dark',
      lineWrapping: true,
      autoCloseBrackets: true,
      styleActiveLine: true,
      indentWithTabs: false,
      autofocus: true
    })
    cm.setOption('extraKeys', {
      Enter: CodeMirror.commands.newlineAndIndentContinueMarkdownList,
      Tab: CodeMirror.commands.indentMore,
      Esc: action.blur,
      'Cmd-U': toggleUnorderedList
    })
    if (item.cursor) cm.setCursor(item.cursor)
    cm.on('change', e => {
      item.notion = cm.getValue()
      item.cursor = cm.getCursor()
      local.update(item)
    })
  })
}

function toggleUnorderedList() {
  let start = cm.getCursor('from')
  let end = cm.getCursor('to')
  let regexp = /^(\s{0,})((\+|\*|\-)\s?)/
  let isList, match
  for (let i = start.line; i <= end.line; i++) {
    let line = cm.getLine(i)
    // Is this an ordered list ?
    if ((match = /^(\s?)(([0-9]+\.)\s+)/.exec(line))) {
      cm.replaceRange('', { line: i, ch: 0 }, { line: i, ch: match[0].length })
      line = line.substr(match[0].length)
    }
    // Is unodered list ?
    if (!match) isList = regexp.test(line)
    if (isList) {
      if ((match = regexp.exec(line))) {
        cm.replaceRange(
          '',
          { line: i, ch: 0 },
          { line: i, ch: match[0].length }
        )
      }
    } else {
      cm.replaceRange(
        '- ' + line.trim(),
        { line: i, ch: 0 },
        { line: i, ch: line.length }
      )
    }
  }
}
