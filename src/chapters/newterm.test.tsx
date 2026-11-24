import { renderToStaticMarkup } from 'react-dom/server'
import { describe, expect, it } from 'vitest'
import { STRINGS } from '../i18n'
import { SHELL_STRINGS } from './l1/shell.strings'
import { WS_STRINGS } from './l2/ws.strings'
import ShellChapter from './l1/ShellChapter'
import WsChapter from './l2/WsChapter'

// The enabled-after-typing half needs a click: covered by logs newterm.mjs on the built page (verify r101-fixread-newterm-click).
const newTermButton = (html: string, label: string) => html.match(new RegExp(`<button[^>]*>${label}</button>`))?.[0] ?? ''

describe("'New terminal' on a fresh page", () => {
  it.each([
    ['1.5 shell', ShellChapter, SHELL_STRINGS.en.newTerm],
    ['2.6 ws', WsChapter, WS_STRINGS.en.newTerm],
  ] as const)('%s: rendered disabled before anything was typed', (_n, C, label) => {
    const html = renderToStaticMarkup(<C t={STRINGS.en} />)
    expect(newTermButton(html, label as string)).toContain('disabled')
  })
})
