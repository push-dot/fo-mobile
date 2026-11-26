import type { Offer } from '@push/api-client'

export const offerBadge = (
  o: Pick<Offer, 'status'>,
  box: 'received' | 'sent',
): { label: string; solid: boolean } => {
  if (o.status === 'ACCEPTED') return { label: '수락함', solid: true }
  if (o.status === 'DECLINED') return { label: '거절함', solid: false }
  if (box === 'received') return { label: '새 제안', solid: false }
  return { label: o.status === 'READ' ? '읽음' : '읽지 않음', solid: false }
}
