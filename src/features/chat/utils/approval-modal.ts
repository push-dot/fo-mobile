import type { Approval } from '../types'

export type ApprovalModalKind = 'page' | 'regular' | 'none'

/**
 * Owner rule 35: a form that links on to other pickers (ChatPh0Input's 변경 rows) is a page-style modal with a close button; a
 * template choice (ChatPh4Design) is a regular modal with no X and no 취소. Every other card stays the drawn panel or the action sheet.
 */
export const approvalModalKind = (approval: Approval): ApprovalModalKind => {
  if (approval.sections.some((s) => s.kind === 'rows')) return 'page'
  if (approval.sections.some((s) => s.kind === 'templates')) return 'regular'
  return 'none'
}
