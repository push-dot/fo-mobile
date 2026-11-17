import { displayName } from '@/shared/utility/display-name'
import type { ChoiceModalRequest } from '@/shared/navigation'
import type { Approval, ApprovalSection, ChatItem, DiffLine } from '../types'
import type { ReviewPageRequest } from '../review-page'
import { choiceSheet, confirmModal, designModal } from './choice-sheet'
import { isStop } from './multi-pick'
import { isBlueprints, planTable } from './plan-table'
import { buttonLabel, chipSends, sectionLabel, sectionPicks } from './stream-v3'

type Row = Extract<ApprovalSection, { kind: 'rows' }>['items'][number]
type Table = NonNullable<ChoiceModalRequest['table']>

export type GateHooks = {
  answer: (text: string, choice: number | number[]) => void
  say: () => void
  change: (row: Row, back: () => void) => void
  table?: Table
  /** The changed lines of the edit under review, and how to open the page that draws them. */
  review?: { lines: DiffLine[]; open: (request: ReviewPageRequest) => void }
}

export const UNDO_LABEL = '되돌리기'
export const NEXT_LABEL = '다음'

export const gateTable = (items: readonly ChatItem[]): Table | undefined => {
  for (const item of [...items].reverse()) {
    if (item.type === 'user') return undefined
    const plan = item.type === 'plan' ? item : item.type === 'agentText' ? item.card : undefined
    if (plan) return isBlueprints(plan) ? undefined : { head: planTable(plan).head, rows: planTable(plan).rows }
  }
  return undefined
}

const choicesForm = (approval: Approval, h: GateHooks): ChoiceModalRequest | null => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  if (!approval.submit || section?.kind !== 'choices') return null
  const rows = section.items.flatMap((c, index) => (isStop(c) ? [] : [{ index, label: c.label, ...(c.desc ? { sub: c.desc } : {}) }]))
  return {
    title: approval.question,
    ...(approval.detail ? { message: approval.detail } : {}),
    ...(h.table ? { table: h.table } : {}),
    form: {
      options: rows.map(({ label, sub }) => ({ label, ...(sub ? { sub } : {}) })),
      selected: section.selected.flatMap((i) => (rows.findIndex((r) => r.index === i) >= 0 ? [rows.findIndex((r) => r.index === i)] : [])),
      multi: !!section.multi,
      confirmLabel: (picked) => (section.multi ? `${picked.length}개로 진행하기` : approval.submit!),
      onConfirm: (picked) => {
        const indexes = picked.map((i) => rows[i]!.index)
        h.answer(indexes.map((i) => section.items[i]!.label).join(', '), section.multi ? indexes : indexes[0]!)
      },
    },
    onDismiss: h.say,
  }
}

const sections = (approval: Approval, h: GateHooks, ask: (request: ChoiceModalRequest) => void) => {
  const sel = approval.sections.map((s) => ('selected' in s ? [...s.selected] : []))
  const order = approval.sections.flatMap((s, i) => (s.kind === 'templates' ? [] : [i]))
  const finish = () => h.answer(sectionLabel(approval, sel), sectionPicks(approval, sel))
  const show = (n: number): void => {
    const si = order[n]!
    const s = approval.sections[si]!
    const last = n === order.length - 1
    const label = last ? (buttonLabel(approval, sel) || '확인') : NEXT_LABEL
    const picked = (chosen: number[]) => sel.map((x, i) => (i === si ? chosen : x))
    const next = () => (last ? finish() : show(n + 1))
    const title = n === 0 ? approval.question : s.kind === 'chips' ? (s.title ?? approval.question) : approval.question
    const base = { title, ...(n === 0 && approval.detail ? { message: approval.detail } : {}), onDismiss: h.say }
    if (s.kind === 'rows') {
      const fixed = s.items.filter((r) => r.action !== 'change')
      const message = [...(n === 0 ? [approval.detail] : []), ...fixed.map((r) => `${displayName(r.title)}${r.sub ? ` · ${r.sub}` : ''}`)].filter(Boolean).join('\n')
      ask({
        ...base,
        title: n === 0 ? approval.question : s.title,
        message,
        items: s.items.flatMap((r) => (r.action === 'change' ? [{ label: displayName(r.title), sub: r.sub, chevron: true, onPress: () => h.change(r, () => show(n)) }] : [])),
        confirm: { label, onPress: next },
      })
      return
    }
    const options = s.kind === 'chips' ? s.options.map((o) => ({ label: o })) : s.kind === 'toggle' || s.kind === 'choices' ? s.items.map((c) => ({ label: c.label, ...(c.desc ? { sub: c.desc } : {}) })) : []
    const multi = s.kind === 'toggle' || !!('multi' in s && s.multi)
    if (last && chipSends(approval)) {
      ask({
        ...base,
        items: options.map((o, i) => ({
          label: o.label,
          onPress: () => {
            sel[si] = [i]
            finish()
          },
        })),
      })
      return
    }
    ask({
      ...base,
      form: {
        options,
        selected: sel[si] ?? [],
        multi,
        ...(last && approval.zeroSubmit ? { allowEmpty: true } : {}),
        confirmLabel: (chosen) => (last ? buttonLabel(approval, picked(chosen)) || label : label),
        onConfirm: (chosen) => {
          sel[si] = chosen
          next()
        },
      },
    })
  }
  show(0)
}

export const openGate = (approval: Approval, h: GateHooks, ask: (request: ChoiceModalRequest) => void) => {
  const design = designModal(approval)
  if (design) {
    ask({
      title: design.title,
      form: {
        options: design.options,
        selected: [design.selected],
        toggle: design.toggle,
        confirmLabel: (picked, on) => design.confirmLabel(picked[0] ?? 0, on),
        onConfirm: (picked, on) => h.answer(...design.answer(picked[0] ?? 0, on)),
      },
      onDismiss: h.say,
    })
    return
  }
  const edit = confirmModal(approval)
  if (edit && h.review?.lines.length) {
    h.review.open({
      lines: h.review.lines,
      apply: () => h.answer(edit.confirm, 0),
      ...(approval.secondary ? { undo: () => h.answer(UNDO_LABEL, 1) } : {}),
      onDismiss: h.say,
    })
    return
  }
  if (edit) {
    ask({ title: edit.title, confirm: { label: edit.confirm, onPress: () => h.answer(edit.confirm, 0), ...(approval.secondary ? { secondary: { label: UNDO_LABEL, onPress: () => h.answer(UNDO_LABEL, 1) } } : {}) }, onDismiss: h.say })
    return
  }
  const form = choicesForm(approval, h)
  if (form) {
    ask(form)
    return
  }
  if (approval.sections.some((s) => s.kind !== 'choices')) {
    sections(approval, h, ask)
    return
  }
  const sheet = choiceSheet(approval)
  if (!sheet) return
  const items = sheet.items.filter((i) => {
    const section = approval.sections[0]
    return section?.kind !== 'choices' || approval.confirm || !isStop(section.items[i.index]!)
  })
  ask({
    title: sheet.title,
    ...(sheet.message ? { message: sheet.message } : {}),
    ...(h.table ? { table: h.table } : {}),
    items: items.map((i) => ({ label: i.label, onPress: () => h.answer(i.label, i.index) })),
    onDismiss: h.say,
  })
}
