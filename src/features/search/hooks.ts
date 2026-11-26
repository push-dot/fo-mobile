import { useDebouncedQuery } from '@/shared/utility/use-debounced-query'
import { SEARCH_DEBOUNCE_MS } from './constants'

export const useSearchQuery = () => useDebouncedQuery(SEARCH_DEBOUNCE_MS)
