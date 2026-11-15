import type { Approval, Choice } from '../types'

export const isSay = (c: Choice) => c.label === '직접 말하기' || c.hint === '직접 말하기'

export type ChoiceSheet = { title: string; message?: string; items: { index: number; label: string }[] }

/**
 * A card that is one single pick the bot has no suggestion for, or a permission (a help question, the page-read permission) is a regular modal (RULINGS 35, ChatBotStatusHelp and ChatBotStatusApprove):
 * the question is its title, the card's detail its message, the options its plain rows. Cards with a confirm button, several picks or sections stay the drawn panel.
 */
export const choiceSheet = (approval: Approval): ChoiceSheet | null => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  if (approval.submit || section?.kind !== 'choices' || section.multi) return null
  const items = section.items.flatMap((c, index) => (isSay(c) ? [] : [{ index, label: c.label }]))
  return { title: approval.question, ...(approval.detail ? { message: approval.detail } : {}), items }
}

/** An edit card (title, message, one 적용 button): the regular modal with a single confirm, swiping it away hands the floor to the composer (ChatApprove). */
export const confirmModal = (approval: Approval) =>
  approval.submit && !approval.sections.length ? { title: approval.question, ...(approval.detail ? { message: approval.detail } : {}), confirm: approval.answer ?? approval.submit } : null

/** A card that is one list of picks with the stop row and a count button (ChatPh2XPrevent): drawn as checkboxes in the bubble. */
export const choiceMulti = (approval: Approval) => {
  const section = approval.sections.length === 1 ? approval.sections[0] : undefined
  return !!approval.submit && !approval.confirm && section?.kind === 'choices' && !!section.multi
}

/** What the bot asks as part of the flow (ChatPh2, ChatPh3Boost, ChatResume): a single pick with a suggested first option, drawn as the numbered bubble under the last line (v425). */
export const choiceInThread = (approval: Approval) =>
  choiceMulti(approval) || (!approval.confirm && choiceSheet(approval) !== null && approval.sections[0]?.kind === 'choices' && approval.sections[0].selected.length > 0)
