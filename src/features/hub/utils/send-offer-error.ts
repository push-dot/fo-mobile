import { ApiError } from '@push/api-client'

/** BLOCKED: the other person blocked the viewer, so the generic retry advice is dropped. */
export const sendOfferError = (e: unknown) => {
  if (e instanceof ApiError && e.code === 'CONFLICT') return '이미 제안을 보냈어요.'
  if (e instanceof ApiError && e.code === 'BLOCKED')
    return '지금은 이 사람에게 제안을 보낼 수 없어요.'
  return '제안을 보내지 못했어요. 잠시 후 다시 시도해 주세요.'
}
