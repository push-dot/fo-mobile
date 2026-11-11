import { ApiError } from '@push/api-client'

export type BotErrorKind = 'limit' | 'protected' | 'conflict' | 'other'

export const botErrorKind = (e: unknown): BotErrorKind => {
  if (!(e instanceof ApiError)) return 'other'
  if (e.code === 'BOT_LIMIT') return 'limit'
  if (e.code === 'DEFAULT_BOT_PROTECTED') return 'protected'
  if (e.code === 'REVISION_CONFLICT') return 'conflict'
  return 'other'
}

export const botErrorCopy = (e: unknown): { title: string; body: string } => {
  const kind = botErrorKind(e)
  if (kind === 'limit' && e instanceof ApiError) {
    const limit = Number(e.details?.limit)
    const plan = e.details?.plan != null ? String(e.details.plan) : ''
    if (Number.isInteger(limit) && plan) {
      return {
        title: '봇을 더 만들 수 없어요',
        body: `${plan}에서는 회사 봇을 ${limit}개까지 만들 수 있어요.`,
      }
    }
    return {
      title: '봇을 더 만들 수 없어요',
      body: '요금제에서 만들 수 있는 회사 봇 수에 도달했어요.',
    }
  }
  if (kind === 'protected') {
    return { title: '지울 수 없어요', body: 'Push Bot은 지울 수 없어요.' }
  }
  if (kind === 'conflict') {
    return { title: '다시 열어 주세요', body: '다른 곳에서 먼저 바뀌었어요.' }
  }
  return { title: '처리하지 못했어요', body: '잠시 뒤에 다시 해 주세요.' }
}
