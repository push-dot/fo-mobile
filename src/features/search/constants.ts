import type { SkeletonRowsShape } from '../../shared/components'

export const TRENDING_STALE_MS = 5 * 60_000

export const SEARCH_PAGE_LIMIT = 20
export const SEARCH_DEBOUNCE_MS = 250
export const SEARCH_ERROR_LINES = ['검색하지 못했어요.', '잠시 후 다시 시도해 주세요.'] as const
export const SEARCH_EMPTY_BODY = '다른 말로 찾아보세요.'
export const SEARCH_CLEAR_LABEL = '검색어 지우기'
export const SEARCH_RETRY_LABEL = '다시 시도'

export const SEARCH_SORTS = [{ key: 'relevance' as const, label: '관련도순' }]

export const SEARCH_SKELETON: SkeletonRowsShape = {
  count: 5,
  lead: { size: 56, radius: 16 },
  lines: [
    { width: '30%', height: 12 },
    { width: '75%', height: 16 },
    { width: '45%', height: 12 },
  ],
}
