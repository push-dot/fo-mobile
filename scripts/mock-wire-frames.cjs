// Codemod: rewrites the chat mock's scripted runs from reducer events (ChatEvent) into the wire frames push-be
// streams (StreamEvent), so mock runs play through the same mapper as a live stream.
//
//   node scripts/mock-wire-frames.cjs [--from <git ref or file>] [--check]
//
// Reads the scripted-run section of src/mock/chat.ts at --from (default: the commit that pinned the golden test),
// writes src/mock/bot-scripts/runs.ts, or with --check fails when that file differs from what it would write.
// --check proves this one conversion only. Once runs.ts is edited by hand, as its header asks, it fails by design.
// The golden test (src/features/chat/__tests__/script-golden.test.ts) proves both forms draw the same chat.
const fs = require('node:fs')
const path = require('node:path')
const { execFileSync } = require('node:child_process')
const ts = require('typescript')

const root = path.resolve(__dirname, '..')
const OUT = path.join(root, 'src/mock/bot-scripts/runs.ts')
const DEFAULT_FROM = 'b2234ad0b0cd99bc6c7c01425c14ff45c5bf8b22'

const AUTO = '자동으로 골랐어요: '
// A status frame carries one sentence, so a comment about rotating verbs no longer holds.
const STALE_COMMENT = '  // The resumed run holds one verb, so a screenshot never catches the rotation on another (ChatInterrupt).\n'
const FIT_PARTS = { '기술 스택': 'techStack', '경험 연관성': 'experienceLink', '경력 수준': 'careerLevel', 키워드: 'keyword', 도메인: 'domain' }
const BUILDERS = new Set(['s', 'status', 'agent', 'tool', 'todo', 'ask', 'numbered', 'done', 'awaitingDone'])
const ROUTE_STATE = new Set(['scenario', 'seq'])
const EXPORTS = new Set(['RESUME', 'MOA', 'PROFILE_TODO', 'TODO', 'PROFILE_TASK', 'TODO_PLUS', 'JD_LINES', 'PH1', 'startDocument', 'tailorResume', 'next', 'verifyFail', 'fail', 'generic', 'pick'])

const HEADER = `// Scripted runs of the chat mock, written as the frames push-be streams (StreamEvent of @push/api-client).
// The app plays them through the same mapper as a live stream, so a run draws what the server's frames would draw.
// Converted from the reducer-event scripts by scripts/mock-wire-frames.cjs. Edit the frames here from now on.
import type { StreamEvent, StreamHunk } from '@push/api-client'
import { HINTLESS_GATES } from '../../features/chat/constants'
import type { Step } from '../../features/chat/types'
`

const BUILDER_BLOCK = `type Frame = Step['frame']
type Card = Extract<StreamEvent, { type: 'choice' | 'approval' }>
type Choice = Extract<Card, { type: 'choice' }>
type Tool = Extract<StreamEvent, { type: 'tool' }>

const s = (wait: number, frame: Frame): Step => ({ wait, frame })
const status = (text: string): Frame => ({ type: 'status', text })
const agent = (text: string): Frame => ({ type: 'token', text })
/** A choice the run made by itself: the app draws "자동으로 골랐어요: {label}". */
const autoPicked = (id: string, label: string): Frame => ({ type: 'choice', id, auto: true, options: [{ id: 'pick', label }], recommended: 'pick' })
const tool = (name: string, summary: string, target: string | undefined, state: Tool['state'], resultLine?: string, extra?: string[]): Tool => ({
  type: 'tool', name, summary, state, ...(target ? { target } : {}), ...(resultLine ? { resultLine } : {}), ...(extra ? { extra } : {}),
})
const todo = (id: string, labels: string[], done: number, added = -1): Frame => ({
  type: 'todo',
  id,
  items: labels.map((text, i) => ({ id: String(i), text, state: i < done ? 'done' : i === done || i === added ? 'now' : 'todo', ...(i === added ? { added: true } : {}) })),
})
const ask = (card: Card) => s(500, card)
/** A numbered card. Its option ids are the positions the scripts branch on. */
const numbered = (id: string, title: string, labels: string[], selected = 0): Choice => ({
  type: 'choice',
  id,
  title,
  options: labels.map((label, i) => ({ id: String(i), label })),
  ...(selected ? { recommended: String(selected) } : {}),
})
/** A tool asking permission: the server's line under the options ("지원하면 취소할 수 없어요") replaces the hint. */
const confirm = (card: Choice, foot: string): Card => ({ type: 'approval', id: card.id, kind: 'TOOL_ACTION', title: card.title!, options: card.options, foot })
/** The closing line above a result card. The app bolds the score change it reads from fitFrom and fitTo. */
const closing = (text: string, bullets?: string[]) => {
  const change = /\\*\\*(\\d+\\.\\d) → (\\d+\\.\\d)\\*\\*/.exec(text)
  return { summary: text.replaceAll('**', ''), ...(change ? { fitFrom: Number(change[1]), fitTo: Number(change[2]) } : {}), ...(bullets ? { bullets } : {}) }
}
const done = s(200, { type: 'done', operation: null })
const awaitingDone = s(200, { type: 'done', operation: null, awaiting: 'approval' })
// The document every scripted edit and draft changes (마이 › 서류 d1).
const DOC = 'd1'
// shortcut: ChatPh3Review draws a "~" (moved) line, which push-be's hunk sign does not have. A8 settles it with the contract.
const MOVED = '~' as StreamHunk['sign']
`

const SAY = `const say = (text: string): Step[] => [s(600, agent(text)), done]`
const FAIL = `export const fail = (code: string, details?: Record<string, unknown>): Step[] => [s(300, { type: 'error', error: { code, message: code, ...(details ? { details } : {}) } })]`

const readSource = (from) => (fs.existsSync(from) ? fs.readFileSync(from, 'utf8') : execFileSync('git', ['show', `${from}:./src/mock/chat.ts`], { cwd: root, encoding: 'utf8' }))

const convert = (source) => {
  const sf = ts.createSourceFile('chat.ts', source, ts.ScriptTarget.Latest, true)
  const text = (n) => source.slice(n.getStart(sf), n.end)
  const fail = (n, why) => {
    const { line } = sf.getLineAndCharacterOfPosition(n.getStart(sf))
    throw new Error(`chat.ts:${line + 1}: ${why}: ${text(n).slice(0, 120)}`)
  }
  const indentOf = (n) => /^[ \t]*/.exec(source.slice(source.lastIndexOf('\n', n.getStart(sf)) + 1))[0]
  const calleeOf = (n) => (ts.isCallExpression(n) && ts.isIdentifier(n.expression) ? n.expression.text : undefined)
  const props = (obj) => {
    const out = {}
    for (const p of obj.properties) if (ts.isPropertyAssignment(p)) out[p.name.getText(sf)] = p.initializer
    return out
  }
  const typeOf = (n) => {
    if (!ts.isObjectLiteralExpression(n)) return undefined
    const t = props(n).type
    return t && ts.isStringLiteral(t) ? t.text : undefined
  }
  const str = (n) => (ts.isStringLiteral(n) || ts.isNoSubstitutionTemplateLiteral(n) ? n.text : fail(n, 'expected a string literal'))
  const quote = (s) => `'${s.replaceAll('\\', '\\\\').replaceAll("'", "\\'")}'`
  const block = (fields, indent) => `{\n${fields.map((f) => `${indent}  ${f},`).join('\n')}\n${indent}}`

  /** Rebuilds a node from its source with every descendant rule applied. */
  const emit = (n) => {
    const ruled = rule(n)
    if (ruled !== undefined) return ruled
    const base = n.getStart(sf)
    let out = text(n)
    const edits = []
    if (ts.isArrayLiteralExpression(n)) {
      const els = n.elements
      for (let i = 0; i < els.length; i++) {
        const merged = i + 1 < els.length ? mergeClosing(els[i], els[i + 1]) : undefined
        if (merged !== undefined) {
          edits.push([els[i].getStart(sf) - base, els[i + 1].end - base, merged])
          i++
          continue
        }
        const e = emit(els[i])
        if (e !== text(els[i])) edits.push([els[i].getStart(sf) - base, els[i].end - base, e])
      }
    } else {
      ts.forEachChild(n, (c) => {
        const e = emit(c)
        if (e !== text(c)) edits.push([c.getStart(sf) - base, c.end - base, e])
      })
    }
    for (const [a, b, r] of edits.reverse()) out = out.slice(0, a) + r + out.slice(b)
    return out
  }

  /** `s(w, agent(id, text, bullets))` then `s(w2, { type: 'result' … })`: the server sends the closing line inside the result frame. */
  const mergeClosing = (first, second) => {
    if (calleeOf(first) !== 's' || calleeOf(second) !== 's') return undefined
    const said = first.arguments[1]
    const card = second.arguments[1]
    if (calleeOf(said) !== 'agent' || typeOf(card) !== 'result') return undefined
    const [w1, w2] = [first.arguments[0], second.arguments[0]]
    const wait = ts.isNumericLiteral(w1) && ts.isNumericLiteral(w2) ? String(Number(w1.text) + Number(w2.text)) : `${emit(w1)} + ${emit(w2)}`
    const closing = `...closing(${said.arguments.slice(1).map(emit).join(', ')})`
    const fields = []
    for (const p of card.properties) {
      const name = ts.isPropertyAssignment(p) ? p.name.getText(sf) : undefined
      if (name === 'id') continue
      fields.push(emit(p))
      if (name === 'source') fields.push(`taskLine: ''`)
    }
    return `s(${wait}, ${block([...fields, closing], indentOf(second))})`
  }

  const rule = (n) => {
    switch (calleeOf(n)) {
      case 'status': {
        const [first] = n.arguments
        if (ts.isSpreadElement(first)) {
          let cond = first.expression
          while (ts.isParenthesizedExpression(cond)) cond = cond.expression
          if (!ts.isConditionalExpression(cond)) fail(n, 'status spread is not a conditional')
          const head = (a) => (ts.isArrayLiteralExpression(a) ? emit(a.elements[0]) : fail(a, 'expected an array of verbs'))
          return `status(${emit(cond.condition)} ? ${head(cond.whenTrue)} : ${head(cond.whenFalse)})`
        }
        return n.arguments.length > 1 ? `status(${emit(first)})` : undefined
      }
      case 'agent': {
        const [id, said, bullets] = n.arguments
        if (bullets) fail(n, 'a line with bullets must sit right before its result card')
        if ((ts.isStringLiteral(said) || ts.isNoSubstitutionTemplateLiteral(said)) && said.text.startsWith(AUTO)) {
          return `autoPicked(${emit(id)}, ${quote(said.text.slice(AUTO.length))})`
        }
        return `agent(${emit(said)})`
      }
      case 'say':
        return `say(${n.arguments.slice(1).map(emit).join(', ')})`
      case 'fail':
        return `fail(${emit(n.arguments[1])})`
      case 'numbered': {
        const [id, title, items, , selected] = n.arguments
        const pick = selected && ts.isArrayLiteralExpression(selected) ? Number(selected.elements[0].getText(sf)) : 0
        return `numbered(${[id, title, items].map(emit).join(', ')}${pick ? `, ${pick}` : ''})`
      }
      case 'ask': {
        const [card] = n.arguments
        return ts.isObjectLiteralExpression(card) ? `ask(${askCard(card)})` : undefined
      }
    }
    switch (typeOf(n)) {
      case 'fit':
        return fitFrame(n)
      case 'diff':
        return diffFrame(n)
      case 'plan':
        return planFrame(n)
      case 'think': {
        const p = props(n)
        return `{ type: 'think', seconds: ${emit(p.seconds)}, phase: ${emit(p.id)} }`
      }
      case 'tool': {
        const p = props(n)
        const call = `tool(${[p.id, p.action, p.target, p.state].map(emit).join(', ')})`
        return p.error ? `{ ...${call}, result: { error: ${emit(p.error)} } }` : call
      }
      case 'result':
        return fail(n, 'a result card needs the closing line right before it')
    }
    // fit's ULTRA projection: the wire carries the projected score the label names ("8점대").
    if (ts.isObjectLiteralExpression(n) && n.properties.some((p) => p.name?.getText(sf) === 'projected')) {
      const p = props(n).projected
      const label = str(props(p).label)
      return `{ projected: { score: ${Number(/\d+/.exec(label)[0])}, ${p.properties.map(emit).join(', ')} } }`
    }
    return undefined
  }

  const fitFrame = (n) => {
    const fields = []
    for (const p of n.properties) {
      const name = ts.isPropertyAssignment(p) ? p.name.getText(sf) : undefined
      if (name === 'id') continue
      if (name === 'caption') fields.push(`band: ${emit(p.initializer)}`)
      else if (name === 'rows') {
        const parts = p.initializer.elements.map((r) => {
          const row = props(r)
          const key = FIT_PARTS[str(row.label)] ?? fail(r, 'unknown fit row')
          return `${key}: ${emit(row.score)}`
        })
        fields.push(`parts: { ${parts.join(', ')} }`)
      } else fields.push(emit(p))
    }
    return block(fields, indentOf(n))
  }

  const diffFrame = (n) => {
    const p = props(n)
    const hunks = p.lines.elements.map((l) => {
      const h = props(l)
      const sign = str(h.sign) === '~' ? 'MOVED' : emit(h.sign)
      return `{ line: ${h.n ? emit(h.n) : 'null'}, sign: ${sign}, text: ${emit(h.text)} }`
    })
    const indent = indentOf(n)
    return `{\n${indent}  type: 'diff', documentId: DOC, revisionId: ${emit(p.id)},\n${indent}  hunks: [\n${hunks.map((h) => `${indent}    ${h},`).join('\n')}\n${indent}  ],\n${indent}}`
  }

  const planFrame = (n) => {
    const fields = []
    for (const p of n.properties) {
      const name = p.name.getText(sf)
      if (name === 'id') fields.push(`id: ${str(p.initializer) === 'fbplan' ? "'feedback'" : "'strategy'"}`)
      else if (name === 'rows') {
        const rows = p.initializer.elements.map((r) => `{ ${r.properties.filter((x) => x.name.getText(sf) !== 'tone').map(emit).join(', ')} }`)
        const indent = indentOf(n)
        fields.push(`rows: [\n${rows.map((r) => `${indent}    ${r},`).join('\n')}\n${indent}  ]`)
      } else fields.push(emit(p))
    }
    return block(fields, indentOf(n))
  }

  /** An approval literal the old scripts built by hand, as the card frame push-be sends for it. */
  const askCard = (obj) => {
    const spread = obj.properties.find(ts.isSpreadAssignment)
    const p = props(obj)
    if (spread) {
      const base = emit(spread.expression)
      if (p.pendingNote) return `{ ...${base}, note: ${emit(p.pendingNote)} }`
      if (p.warning) return `confirm(${base}, ${emit(p.warning)})`
      if (p.sections) return `{ ...${base}, multiple: true }`
      if (p.foot) return `{ ...${base}, gate: HINTLESS_GATES[0] }`
      return fail(obj, 'unknown numbered card')
    }
    const indent = indentOf(obj)
    const sections = p.sections.elements
    if (!sections.length) {
      return block([`type: 'approval'`, `id: ${emit(p.id)}`, `kind: 'DOCUMENT_EDIT'`, `title: ${emit(p.question)}`, `documentId: DOC`, `options: [{ id: 'apply', label: ${emit(p.submit)} }, { id: 'keep', label: ${emit(p.secondary)} }]`], indent)
    }
    let recommended
    const wire = sections.map((sec, si) => {
      const x = props(sec)
      const sid = `s${si}`
      const ids = (n) => Array.from({ length: n }, (_, i) => `${sid}.${i}`)
      const picked = (all) => `[${x.selected.elements.map((e) => quote(all[Number(e.getText(sf))])).join(', ')}]`
      switch (str(x.kind)) {
        case 'chips': {
          const all = ids(x.options.elements.length)
          const options = x.options.elements.map((o, i) => `{ id: '${all[i]}', label: ${emit(o)} }`)
          return `{ kind: 'chips', id: '${sid}'${x.title ? `, title: ${emit(x.title)}` : ''}${x.multi ? ', multiple: true' : ''}, options: [${options.join(', ')}], selected: ${picked(all)} }`
        }
        case 'rows': {
          const at = `${indent}    `
          const options = x.items.elements.map((r, i) => {
            const row = props(r)
            const link = str(row.tag) === 'link'
            const extra = [`sub: ${emit(row.sub)}`, ...(link ? [] : [`badge: ${emit(row.tag)}`]), ...(row.action ? [`action: ${emit(row.action)}`] : [])]
            // The app draws the link tile for the GitHub row by this id.
            return `${at}    { id: '${link ? 'm_github' : `${sid}.${i}`}', label: ${emit(row.title)}, ${extra.join(', ')} },`
          })
          return `{\n${at}  kind: 'rows',\n${at}  id: '${sid}',\n${at}  title: ${emit(x.title)},\n${at}  options: [\n${options.join('\n')}\n${at}  ],\n${at}}`
        }
        case 'toggle': {
          const all = x.ids.elements.map(str)
          const options = x.items.elements.map((c, i) => `{ id: '${all[i]}', ${c.properties.map(emit).join(', ')} }`)
          return `{ kind: 'toggle', id: '${sid}', options: [${options.join(', ')}], selected: ${picked(all)} }`
        }
        case 'templates': {
          const items = x.items.elements.map(props)
          const all = items.map((t) => str(t.id))
          recommended = items.find((t) => t.recommended)?.id
          const options = items.map((t) => `{ id: ${emit(t.id)}, label: ${emit(t.label)} }`)
          return `{ kind: 'thumbnails', id: '${sid}', options: [${options.join(', ')}], selected: ${picked(all)} }`
        }
        default:
          return fail(sec, 'unknown section kind')
      }
    })
    const submit = [`label: ${emit(p.submit)}`, ...(p.zeroSubmit ? [`zeroLabel: ${emit(p.zeroSubmit)}`] : []), ...(p.submitLabels ? [`optionLabels: ${emit(p.submitLabels)}`] : [])]
    return block(
      [
        `type: 'choice'`,
        `id: ${emit(p.id)}`,
        `title: ${emit(p.question)}`,
        `options: [${p.secondary ? `{ id: 'cancel', label: ${emit(p.secondary)} }` : ''}]`,
        ...(recommended ? [`recommended: ${emit(recommended)}`] : []),
        `sections: [\n${wire.map((w) => `${indent}    ${w},`).join('\n')}\n${indent}  ]`,
        `submit: { ${submit.join(', ')} }`,
      ],
      indent,
    )
  }

  const startMark = source.indexOf('// ---------- scripted runs ----------')
  const endMark = source.indexOf('// The scripted run answers QUEUE_BUSY')
  if (startMark < 0 || endMark < 0) throw new Error('chat.ts: scripted-run section not found')
  const statements = sf.statements.filter((st) => st.getStart(sf) > startMark && st.end <= endMark)

  let out = HEADER
  let wroteBuilders = false
  for (const st of statements) {
    const decl = ts.isVariableStatement(st) ? st.declarationList.declarations[0] : undefined
    const name = decl && ts.isIdentifier(decl.name) ? decl.name.text : undefined
    if (name && BUILDERS.has(name)) {
      if (!wroteBuilders) out += `\n${BUILDER_BLOCK}`
      wroteBuilders = true
      continue
    }
    // Route state stays in chat.ts, with the comment above it.
    if (name && ROUTE_STATE.has(name)) continue
    const lead = source.slice(st.pos, st.getStart(sf)).replace('// ---------- scripted runs ----------', '')
    let body
    if (name === 'say') body = SAY
    else if (name === 'fail') body = FAIL
    else {
      body = emit(st)
      if (name === 'pick') {
        body = body.replace('intent?: string)', 'intent?: string, run?: string)').replace('TOKENS[account.run ?? t]', 'TOKENS[run ?? t]')
        if (!body.includes('TOKENS[run ?? t]')) fail(st, 'pick no longer reads the run switch')
      }
      if (name && EXPORTS.has(name) && !body.startsWith('export ')) body = `export ${body}`
    }
    out += lead + body
  }
  return `${out.replace(STALE_COMMENT, '').replace(/\n{3,}/g, '\n\n').trimEnd()}\n`
}

module.exports = { convert }

if (require.main === module) {
  const args = process.argv.slice(2)
  const fromAt = args.indexOf('--from')
  const from = fromAt >= 0 ? args[fromAt + 1] : DEFAULT_FROM
  const next = convert(readSource(from))
  if (args.includes('--check')) {
    const current = fs.existsSync(OUT) ? fs.readFileSync(OUT, 'utf8') : ''
    if (current !== next) {
      console.error(`mock-wire-frames: ${path.relative(root, OUT)} differs from the codemod output of ${from}`)
      process.exitCode = 1
    }
  } else {
    fs.writeFileSync(OUT, next)
    console.log(`mock-wire-frames: wrote ${path.relative(root, OUT)} from ${from}`)
  }
}
