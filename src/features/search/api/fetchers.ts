import { api } from '../../../shared/infrastructure'
import { SEARCH_PAGE_LIMIT } from '../constants'
import type { SearchTab } from '../utils'

export const fetchSearch = <T extends SearchTab>(q: string, type: T, cursor: string | undefined) =>
  api.search(q, type, { limit: SEARCH_PAGE_LIMIT, cursor })
