import type { Approval, Choice } from '../types'
import { sectionLabel, sectionPicks } from './stream-v3'

export const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'

export type ChoiceSheet = { title: string; message?: string; items: { index: number; label: string }[] }

/**
 * A card that is one single pick the bot has no suggestion for, or a permission (a help question, the page-read permission) is a regular modal (RULINGS 35, ChatBotStatusHelp and ChatBotStatusApprove):
 */
export const choiceSheet = (approval: Approval): ChoiceSheet | null => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  if (approval.submit || section?.kind !== 'choices' || section.multi) return null
  const items = section.items.flatMap((c, index) => (isSay(c) ? [] : [{ index, label: c.label }]))
  const message = [approval.detail, approval.warning].filter(Boolean).join('\n\n')
  return { title: approval.question, ...(message ? { message } : {}), items }
}

/** An edit card (one 적용 button): the page of the changed document (ChatApprove). With no lines to draw it is a plain confirm; swiping it away hands the floor to the composer. */
export const confirmModal = (approval: Approval) => (approval.submit && !approval.sections.length ? { title: approval.question, confirm: approval.answer ?? approval.submit } : null)

/**
 * The template card (ChatPh4Design) is a regular modal too: its question is the title, the templates are rows (the recommended one carries 추천), the toggle is a switch row,
 * and the button names the pick ("클래식으로 만들기"). `answer` turns the pick and the switch into the card's answer.
 */
export const designModal = (approval: Approval) => {
  const ti = approval.sections.findIndex((s) => s.kind === 'templates')
  const tpl = approval.sections[ti]
  if (tpl?.kind !== 'templates' || !approval.submit) return null
  const gi = approval.sections.findIndex((s) => s.kind === 'toggle')
  const toggle = approval.sections[gi]
  const picks = (selected: number, on: boolean) => approval.sections.map((s, i) => (i === ti ? [selected] : i === gi ? (on ? [0] : []) : 'selected' in s ? s.selected : []))
  return {
    title: approval.question,
    options: tpl.items.map((t) => ({ label: t.label, ...(t.recommended ? { sub: '추천' } : {}) })),
    selected: tpl.selected[0] ?? 0,
    ...(toggle?.kind === 'toggle' && toggle.items[0] ? { toggle: { label: toggle.items[0].label, on: toggle.selected.length > 0 } } : {}),
    confirmLabel: (selected: number, on: boolean) => sectionLabel(approval, picks(selected, on)),
    answer: (selected: number, on: boolean): [string, number[]] => [sectionLabel(approval, picks(selected, on)), sectionPicks(approval, picks(selected, on))],
  }
}
