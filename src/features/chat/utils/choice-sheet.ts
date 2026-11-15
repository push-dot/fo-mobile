import type { Approval, Choice } from '../types'

export const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'

export type ChoiceSheet = { title: string; message?: string; items: { index: number; label: string; destructive: boolean }[] }

/**
 * A card that is one single pick the bot has no suggestion for, or a permission (a help question, the page-read permission) is a regular modal (RULINGS 35, ChatBotStatusHelp and ChatBotStatusApprove):
 * the question is its title, the card's detail its message, the options its plain rows. Cards with a confirm button, several picks or sections stay the drawn panel.
 */
export const choiceSheet = (approval: Approval): ChoiceSheet | null => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  if (approval.submit || section?.kind !== 'choices' || section.multi) return null
  const items = section.items.flatMap((c, index) => (isSay(c) ? [] : [{ index, label: c.label, destructive: approval.optionIds[index] === 'reject' }]))
  return { title: approval.question, ...(approval.detail ? { message: approval.detail } : {}), items }
}

/** What the bot asks as part of the flow (ChatPh2, ChatPh3Boost, ChatResume): a single pick with a suggested first option, drawn as the numbered bubble under the last line (v425). */
export const choiceInThread = (approval: Approval) => !approval.confirm && choiceSheet(approval) !== null && approval.sections[0]?.kind === 'choices' && approval.sections[0].selected.length > 0
