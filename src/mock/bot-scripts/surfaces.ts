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

export const surface = (name: FixtureName, id: string) => fixtureFrame(name, id)

export const profileSurface = (id: string, name: string, documentId: string) => setProps(fixtureFrame('result-profile', id), 'document', { name, documentId })

export const todoSurface = (id: string, labels: string[], done: number, added = -1) =>
  fixtureFrame('todo', `todo:${id}`, {
    items: labels.map((text, i) => ({ text, state: i < done ? 'done' : i === done || i === added ? 'running' : 'waiting' })),
  })

export const choiceSurface = (id: string, title: string, labels: string[], o: { recommended?: number; multiple?: boolean; submit?: string } = {}) => {
  const choices: Choice[] = labels.map((label, i) => ({ id: String(i), label, ...(i === o.recommended ? { recommended: true } : {}) }))
  const many = o.multiple || o.submit !== undefined
  const frame = fixtureFrame(many ? 'choice-multiple' : 'choice-single', id, many ? { selected: { q: [] } } : undefined)
  return setProps(frame, 'root', {
    questions: [{ id: 'q', title, ...(o.multiple ? { multiple: true } : {}), choices }],
    ...(o.submit ? { submit: { label: o.submit } } : {}),
  })
}

export const confirmSurface = (id: string, title: string, labels: string[], detail?: string) => {
  const choices: Choice[] = labels.map((label, i) => ({ id: String(i), label }))
  const buttons = labels.length === 2
  const frame = fixtureFrame(buttons ? 'approval-tool' : 'approval-site', id)
  const textId = buttons ? 'row0' : 'detail'
  const titled = setProps(setProps(frame, 'title', { text: title }), 'choice', { questions: [{ id: 'q', choices: buttons ? [choices[1]!, choices[0]!] : choices }] })
  return detail ? setProps(titled, textId, { text: detail }) : withoutChild(titled, textId)
}

export const pageReadSurface = (id: string, title: string, detail: string) => setProps(setProps(fixtureFrame('approval-site', id), 'title', { text: title }), 'detail', { text: detail })

export const editSurface = (id: string, lines: { sign: '' | '+' | '-'; text: string }[], documentId: string, title: string) =>
  setProps(fixtureFrame('approval-edit', id), 'diff', { title, lines, documentId })

export const storedCardSurface = (card: { id: string; for: 'answer' | 'confirm'; title: string; options: Choice[]; recommended?: string; summary?: string }, open: boolean) => {
  const choices = card.options.map((o) => ({ ...o, ...(o.id === card.recommended ? { recommended: true } : {}) }))
  const model = { open, picked: [] }
  if (card.for === 'confirm') {
    const frame = setProps(setProps(fixtureFrame('approval-site', card.id, model), 'title', { text: card.title }), 'choice', { questions: [{ id: 'q', choices }] })
    return card.summary ? setProps(frame, 'detail', { text: card.summary }) : withoutChild(frame, 'detail')
  }
  return setProps(fixtureFrame('choice-single', card.id, model), 'root', { questions: [{ id: 'q', title: card.title, choices }] })
}
