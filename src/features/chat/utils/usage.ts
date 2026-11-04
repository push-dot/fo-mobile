const FREE_BODY = '이번 달 사용량을 다 썼어요. 요금제를 올리거나 크레딧을 구매할 수 있어요.'
const ULTRA_BODY = '이번 달 사용량을 다 썼어요. 크레딧을 구매하면 바로 이어서 쓸 수 있어요.'

export const usageExhausted = (plan: string) =>
  plan === 'ULTRA'
    ? { body: ULTRA_BODY, actions: ['크레딧 구매'] as const }
    : { body: FREE_BODY, actions: ['요금제 올리기', '크레딧 구매'] as const }

export const isUsageExhausted = (code?: string) => code === 'FEATURE_DISABLED' || code === 'INSUFFICIENT_CREDITS'
