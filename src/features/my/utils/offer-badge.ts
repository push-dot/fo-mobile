import type { Offer } from '@push/api-client'
import type { BadgeTone } from '@/shared/components'

export const offerBadge = (
  o: Pick<Offer, 'status'>,
  box: 'received' | 'sent',
): { label: string; tone: BadgeTone } => {
  if (o.status === 'ACCEPTED') return { label: '수락함', tone: 'green' }
  if (o.status === 'DECLINED') return { label: '거절함', tone: 'grey' }
  if (box === 'received') return { label: '새 제안', tone: 'ac' }
  return { label: o.status === 'READ' ? '읽음' : '읽지 않음', tone: 'grey' }
}
