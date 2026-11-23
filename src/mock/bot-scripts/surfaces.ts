// Bot cards of the mock scripts, built from the golden A2UI fixtures: each takes a fixture's layout, bindings and data
// model as the server sends them, and only puts the script's own words and option ids into it, so a tour reads as before
// and still branches on the option a person picked. Kinds the scripts never word themselves are the fixture as it is.
import type { A2uiComponent, A2uiFrame } from '@push/api-client'
import { fixtureFrame, type FixtureName } from '../a2ui-fixtures'

type Choice = { id: string; label: string; desc?: string; recommended?: boolean }

const editComponents = (frame: A2uiFrame, edit: (components: A2uiComponent[]) => A2uiComponent[]): A2uiFrame => ({
  ...frame,
  messages: frame.messages.map((m) => ('updateComponents' in m ? { ...m, updateComponents: { ...m.updateComponents, components: edit(m.updateComponents.components) } } : m)),
})

const setProps = (frame: A2uiFrame, id: string, props: Record<string, unknown>) =>
  editComponents(frame, (cs) => cs.map((c) => (c.id === id ? { ...c, ...props } : c)))

const withoutChild = (frame: A2uiFrame, child: string) =>
  editComponents(frame, (cs) => cs.filter((c) => c.id !== child).map((c) => (Array.isArray(c.children) ? { ...c, children: (c.children as string[]).filter((x) => x !== child) } : c)))

/** A fixture as it is, under the script's surface id. */
export const surface = (name: FixtureName, id: string) => fixtureFrame(name, id)

/** The to-do list (fixture todo) with the script's steps: done before `done`, running at `done` (and at `added`), then waiting. */
export const todoSurface = (id: string, labels: string[], done: number, added = -1) =>
  fixtureFrame('todo', `todo:${id}`, {
    items: labels.map((text, i) => ({ text, state: i < done ? 'done' : i === done || i === added ? 'running' : 'waiting' })),
  })

/**
 * A question with numbered options (fixture choice-single: a tap answers; choice-multiple with `multiple` or `submit`: picks
 * and a button). Option ids are the positions the scripts branch on.
 */
export const choiceSurface = (id: string, title: string, labels: string[], o: { recommended?: number; multiple?: boolean; submit?: string } = {}) => {
  const choices: Choice[] = labels.map((label, i) => ({ id: String(i), label, ...(i === o.recommended ? { recommended: true } : {}) }))
  const many = o.multiple || o.submit !== undefined
  const frame = fixtureFrame(many ? 'choice-multiple' : 'choice-single', id, many ? { selected: { q: [] } } : undefined)
  return setProps(frame, 'root', {
    questions: [{ id: 'q', title, ...(o.multiple ? { multiple: true } : {}), choices }],
    ...(o.submit ? { submit: { label: o.submit } } : {}),
  })
}

/**
 * A tool asking permission. Two options (fixture approval-tool): the way out left, the action right. More (fixture
 * approval-site): rows. `detail` is the line under the question. Ids are the script's positions.
 */
export const confirmSurface = (id: string, title: string, labels: string[], detail?: string) => {
  const choices: Choice[] = labels.map((label, i) => ({ id: String(i), label }))
  const buttons = labels.length === 2
  const frame = fixtureFrame(buttons ? 'approval-tool' : 'approval-site', id)
  const textId = buttons ? 'row0' : 'detail'
  const titled = setProps(setProps(frame, 'title', { text: title }), 'choice', { questions: [{ id: 'q', choices: buttons ? [choices[1]!, choices[0]!] : choices }] })
  return detail ? setProps(titled, textId, { text: detail }) : withoutChild(titled, textId)
}

/** A page-read card (fixture approval-site, its three options as they are) asking to open a company page. */
export const pageReadSurface = (id: string, title: string, detail: string) => setProps(setProps(fixtureFrame('approval-site', id), 'title', { text: title }), 'detail', { text: detail })

/** An edit to apply (fixture approval-edit: the PushDiff, then 되돌리기 | 적용) with the script's changed lines. */
export const editSurface = (id: string, lines: { sign: '' | '+' | '-'; text: string }[], documentId: string, title: string) =>
  setProps(fixtureFrame('approval-edit', id), 'diff', { title, lines, documentId })

/**
 * A card a bot fixture stores (bots.ts), as the transcript replays it: a confirm on approval-site, a question on
 * choice-single, with the card's own options. A closed card replays answered, with nothing picked (the fixture keeps no pick).
 */
export const storedCardSurface = (card: { id: string; for: 'answer' | 'confirm'; title: string; options: Choice[]; recommended?: string; summary?: string }, open: boolean) => {
  const choices = card.options.map((o) => ({ ...o, ...(o.id === card.recommended ? { recommended: true } : {}) }))
  const model = { open, picked: [] }
  if (card.for === 'confirm') {
    const frame = setProps(setProps(fixtureFrame('approval-site', card.id, model), 'title', { text: card.title }), 'choice', { questions: [{ id: 'q', choices }] })
    return card.summary ? setProps(frame, 'detail', { text: card.summary }) : withoutChild(frame, 'detail')
  }
  return setProps(fixtureFrame('choice-single', card.id, model), 'root', { questions: [{ id: 'q', title: card.title, choices }] })
}
