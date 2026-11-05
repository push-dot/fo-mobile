const FREE_BODY = '이번 달 사용량을 다 썼어요. 요금제를 올리거나 크레딧을 구매할 수 있어요.'
const ULTRA_BODY = '이번 달 사용량을 다 썼어요. 크레딧을 구매하면 바로 이어서 쓸 수 있어요.'

const PLAN = { id: 'plan', label: '요금제 올리기', variant: 'secondary' } as const
const CREDITS = { id: 'credits', label: '크레딧 구매', variant: 'primary' } as const

export const usageExhausted = (plan: string) =>
  plan === 'ULTRA' ? { body: ULTRA_BODY, actions: [CREDITS] } : { body: FREE_BODY, actions: [PLAN, CREDITS] }

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'
