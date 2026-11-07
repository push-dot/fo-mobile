import type { Approval, Choice } from '../types'

export const isStop = (c: Choice) => c.label === '그만하기' || c.label === '그만할게요'

/** A multi-pick gate ends in [그만하기] [N개로 진행하기]: the stop row leaves the grid and the count shows on the button. */
export const multiPick = (approval: Approval, sel: number[][]) => {
  const at = approval.sections.findIndex((s) => s.kind === 'choices' && s.multi)
  const section = at >= 0 ? approval.sections[at] : undefined
  const items = section?.kind === 'choices' ? section.items : []
  const stopAt = items.findIndex(isStop)
  const picked = at >= 0 ? (sel[at]?.length ?? 0) : 0
  return {
    at,
    items,
    stopAt,
    stopLabel: approval.secondary ?? items[stopAt]?.label,
    picked,
    submitLabel: at >= 0 ? `${picked}개로 진행하기` : approval.submit,
    disabled: at >= 0 && picked === 0,
  }
}
