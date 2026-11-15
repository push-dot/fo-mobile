import type { Approval, Choice } from '../types'

export const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'

export type ChoiceSheet = { title: string; message?: string; cancel: string; items: { index: number; label: string; destructive: boolean }[] }

/**
 * A card that is one single pick (a choice gate, the page-read permission) is the platform's action sheet on iOS:
 * the question is its title, the option notes its message, 직접 말하기 the cancel row. Cards with a confirm button, several picks or
 * sections stay the drawn panel.
 */
export const choiceSheet = (approval: Approval): ChoiceSheet | null => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  if (approval.submit || section?.kind !== 'choices' || section.multi) return null
  const items = section.items.flatMap((c, index) => (isSay(c) ? [] : [{ index, label: c.label, destructive: approval.optionIds[index] === 'reject', note: c.desc }]))
  const notes = items.flatMap((i) => (i.note ? [`${i.label}: ${i.note}`] : []))
  const message = [approval.detail, ...notes].filter(Boolean).join('\n')
  return { title: approval.question, ...(message ? { message } : {}), cancel: section.items.find(isSay)?.label ?? '직접 말하기', items: items.map(({ index, label, destructive }) => ({ index, label, destructive })) }
}
