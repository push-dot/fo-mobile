import { planRequired, usageExhausted } from './utils/usage'

const USAGE_BODY = usageExhausted('FREE').body

export const ERROR_TEXT: Record<string, string> = {
  FEATURE_DISABLED: USAGE_BODY,
  INSUFFICIENT_CREDITS: USAGE_BODY,
  PLAN_REQUIRED: planRequired('FREE'),
  QUEUE_BUSY: '지금 요청이 많아요. 잠시 뒤에 다시 보내 주세요.',
  APPROVAL_ALREADY_RESOLVED: '이미 답한 요청이에요.',
  APPROVAL_EXPIRED: '시간이 지나서 답할 수 없어요. 다시 보내 주세요.',
  NOT_CONFIGURED: '지금은 에이전트를 쓸 수 없어요. 잠시 뒤에 다시 해 주세요.',
}
