import type { BadgeTone } from '@/shared/components'
import type { ChoiceSection, ChoiceSubmit, StreamEvent, StreamOption } from '@push/api-client'
import { MULTI_PICK_FOOT } from '../constants'
import type { Approval, ApprovalSection, ChatEvent, ChatItem, Choice, TemplateLayout } from '../types'

/** Badge colour for a plan or feedback tag. Unknown tags stay grey. */
export const PLAN_TAG_TONE: Record<string, BadgeTone> = {
  강화: 'ac',
  수정: 'grey',
  추가: 'green',
  축소: 'orange',
  키워드: 'orange',
  도메인: 'orange',
  통과: 'green',
  조건부: 'orange',
}

const VERDICT_TAGS = ['통과', '조건부']

export const isVerdictPlan = (rows: { tag: string }[]) => rows.length > 0 && rows.every((r) => VERDICT_TAGS.includes(r.tag))

export const planTone = (tag: string): BadgeTone => PLAN_TAG_TONE[tag] ?? 'grey'

const toggleChoiceOf = (o: StreamOption): Choice => ({
  label: o.label,
  ...(o.desc ?? o.sub ? { desc: (o.desc ?? o.sub)! } : {}),
  ...(o.badge ? { badge: { label: o.badge, tone: 'ac' as const } } : {}),
})

const templateLayoutOf = (o: StreamOption): TemplateLayout => {
  const key = `${o.id} ${o.label}`.toLowerCase()
  return key.includes('modern') || key.includes('모던') ? 'modern' : key.includes('compact') || key.includes('컴팩트') ? 'compact' : key.includes('ats') ? 'ats' : 'classic'
}

const picked = (ids: string[] | undefined, selected: string[] | undefined) =>
  (ids ?? []).flatMap((id, i) => (selected?.includes(id) ? [i] : []))

const sectionOf = (raw: ChoiceSection | { kind: string }, recommended?: string): ApprovalSection | null => {
  if (raw.kind !== 'chips' && raw.kind !== 'rows' && raw.kind !== 'toggle' && raw.kind !== 'thumbnails') return null
  const s = raw as ChoiceSection
  switch (s.kind) {
    case 'chips':
      return {
        id: s.id,
        kind: 'chips',
        title: s.title,
        options: s.options.map((o) => o.label),
        ids: s.options.map((o) => o.id),
        selected: picked(s.options.map((o) => o.id), s.selected),
        ...(s.multiple ? { multi: true } : {}),
      }
    case 'rows':
      return {
        id: s.id,
        kind: 'rows',
        title: s.title ?? '가져올 자료',
        items: s.options.map((o) => ({
          id: o.id,
          // ChatPh0Input: company initial, a link tile for GitHub, nothing for the file.
          tag: o.badge ?? (o.id === 'm_github' ? 'link' : ''),
          title: o.label,
          sub: o.sub ?? '',
          // A Push location (마이 › 서류) is accent; "이력서에서 찾았어요" stays grey.
          ac: !!o.sub?.includes('›'),
          ...(o.action ? { action: o.action } : {}),
        })),
      }
    case 'toggle':
      return {
        id: s.id,
        kind: 'toggle',
        items: s.options.map(toggleChoiceOf),
        ids: s.options.map((o) => o.id),
        selected: picked(s.options.map((o) => o.id), s.selected),
      }
    case 'thumbnails':
      return {
        id: s.id,
        kind: 'templates',
        items: s.options.map((o) => ({
          id: o.id,
          label: o.label,
          layout: templateLayoutOf(o),
          ...(o.badge === '추천' || o.id === recommended ? { recommended: true } : {}),
        })),
        selected: picked(s.options.map((o) => o.id), s.selected),
      }
    default:
      return null
  }
}

const answerableIds = (sections: ApprovalSection[]) =>
  sections.flatMap((s) => {
    if (s.kind === 'rows') return []
    if (s.kind === 'chips' || s.kind === 'toggle') return s.ids ?? []
    if (s.kind === 'templates') return s.items.map((t) => t.id).filter((id): id is string => !!id)
    return s.ids ?? []
  })

export const approvalFromSections = (ev: Extract<StreamEvent, { type: 'choice' }>): Approval => {
  const sections = (ev.sections ?? []).flatMap((s) => {
    const mapped = sectionOf(s, ev.recommended)
    return mapped ? [mapped] : []
  })
  const submit: ChoiceSubmit | undefined = ev.submit
  const pending = ev.note && (!ev.resolution || ev.resolution.status === 'PENDING') ? ev.note : undefined
  const cancel = ev.options.find((o) => o.id === 'cancel')
  const multi = sections.some((s) => (s.kind === 'chips' || s.kind === 'choices') && s.multi)
  return {
    id: ev.id,
    question: ev.title ?? '',
    ...(multi ? { foot: MULTI_PICK_FOOT } : {}),
    sections,
    optionIds: ['submit', ...answerableIds(sections), ...(cancel ? ['cancel'] : [])],
    ...(cancel ? { secondary: cancel.label } : {}),
    ...(submit ? { submit: submit.label } : {}),
    ...(submit?.optionLabels ? { submitLabels: submit.optionLabels } : {}),
    ...(submit?.zeroLabel ? { zeroSubmit: submit.zeroLabel } : {}),
    ...(pending ? { pendingNote: pending } : {}),
  }
}

export const mapThink = (ev: Extract<StreamEvent, { type: 'think' }>): ChatItem => ({
  type: 'think',
  id: `think-${ev.seq ?? ev.phase ?? '0'}`,
  seconds: ev.seconds,
})

export const mapPlan = (ev: Extract<StreamEvent, { type: 'plan' }>): ChatItem => ({
  type: 'plan',
  id: ev.id ?? `plan-${ev.seq ?? 0}`,
  title: ev.title,
  meta: ev.meta,
  rows: ev.rows.map((r) => ({ tag: r.tag, tone: planTone(r.tag), label: r.label, note: r.note })),
  keywords: ev.keywords ?? [],
})

export const mapPaper = (ev: Extract<StreamEvent, { type: 'paper' }>): ChatItem => ({
  type: 'paper',
  id: ev.id,
  label: ev.label,
  heading: ev.heading,
  lines: ev.lines,
})

/** Submit label follows the selected thumbnail, else replaces {n}. */
export const submitLabelFor = (approval: Approval, selected: { templateId?: string; toggleCount: number }): string => {
  const fromThumb = selected.templateId ? approval.submitLabels?.[selected.templateId] : undefined
  if (fromThumb) return fromThumb
  const base = approval.submit ?? ''
  if (!base.includes('{n}')) return base
  if (selected.toggleCount === 0 && approval.zeroSubmit) return approval.zeroSubmit
  return base.replaceAll('{n}', String(selected.toggleCount))
}

/** A card whose last section is a single-pick chip row (ChatPh0Input 말투) is sent by tapping that chip. */
export const chipSends = (approval: Approval) => {
  const last = approval.sections.at(-1)
  return last?.kind === 'chips' && !last.multi
}

/** The user bubble after a section card: ChatPh0Input "이력서만 · 자료 3개 · 원래 말투로", else the button label. */
export const sectionLabel = (approval: Approval, sel: number[][]): string => {
  if (chipSends(approval))
    return approval.sections
      .flatMap((s, si) => {
        if (s.kind === 'rows') return s.items.length ? [`자료 ${s.items.length}개`] : []
        if (s.kind !== 'chips') return []
        const labels = (sel[si] ?? []).map((i) => s.options[i]!)
        return labels.length ? [s.multi && labels.length === 1 ? `${labels[0]}만` : labels.join(', ')] : []
      })
      .join(' · ')
  const ti = approval.sections.findIndex((s) => s.kind === 'templates')
  const tpl = approval.sections[ti]
  const templateId = tpl?.kind === 'templates' ? tpl.items[sel[ti]?.[0] ?? -1]?.id : undefined
  const toggleCount = approval.sections.reduce((n, s, si) => n + (s.kind === 'toggle' ? (sel[si]?.length ?? 0) : 0), 0)
  return submitLabelFor(approval, { templateId, toggleCount })
}

/** Inverse of sectionPicks: the per-section selection a stored answer made (replay). */
export const sectionSel = (approval: Approval, ids: string[]): number[][] =>
  approval.sections.map((s) => {
    const own = s.kind === 'templates' ? s.items.map((t) => t.id ?? '') : s.kind === 'chips' || s.kind === 'toggle' ? (s.ids ?? []) : []
    return own.flatMap((id, i) => (ids.includes(id) ? [i] : []))
  })

/** Section card answer as indexes into `optionIds`: submit first, then each pick in answerable sections (push-be #224). */
export const sectionPicks = (approval: Approval, sel: number[][]): number[] => {
  const ids = approval.optionIds ?? []
  const picked = approval.sections.flatMap((s, si) => {
    if (s.kind === 'rows' || s.kind === 'choices') return []
    const own = s.kind === 'templates' ? s.items.map((t) => t.id ?? '') : (s.ids ?? [])
    return (sel[si] ?? []).flatMap((i) => (own[i] ? [own[i]] : []))
  })
  return ['submit', ...picked].map((id) => ids.indexOf(id)).filter((i) => i >= 0)
}

export const attachPendingNote = (items: ChatItem[], note: string | undefined): ChatItem[] => {
  if (!note) return items
  const i = items.findLastIndex((it) => it.type === 'result' && it.source === 'profile')
  if (i < 0) return items
  const next = items.slice()
  const card = next[i]
  if (card?.type !== 'result' || card.source !== 'profile') return items
  next[i] = { ...card, pendingNote: note }
  return next
}

export const clearPendingNote = (items: ChatItem[]): ChatItem[] =>
  items.map((it) => (it.type === 'result' && it.source === 'profile' && it.pendingNote ? { ...it, pendingNote: undefined } : it))

export const isSectionChoice = (ev: ChatEvent): ev is Extract<ChatEvent, { type: 'approval' }> =>
  ev.type === 'approval' && ev.approval.sections.some((s) => s.kind !== 'choices')
