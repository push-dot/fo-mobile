import type { Approval } from '../types'

export type ApprovalModalKind = 'page' | 'none'

/**
 * Owner rule 35: a form that links on to other pickers (ChatPh0Input's 변경 rows) is a page-style modal with a close button. The template choice
 * (ChatPh4Design) is a regular modal drawn by the choice sheet (designModal), so the panel draws nothing for it. Every other card stays the drawn panel or the action sheet.
 */
export const approvalModalKind = (approval: Approval): ApprovalModalKind => (approval.sections.some((s) => s.kind === 'rows') ? 'page' : 'none')
