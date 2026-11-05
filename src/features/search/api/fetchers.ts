import { api } from '../../../shared/infrastructure'
import { SEARCH_PAGE_LIMIT } from '../constants'
import type { SearchSort } from '../types'
import type { SearchTab } from '../utils'

export const fetchSearch = <T extends SearchTab>(q: string, type: T, cursor: string | undefined, _sort: SearchSort) =>
  // shortcut: push-be /search ranks by relevance only and has no sort param; send sort once it does.
  api.search(q, type, { limit: SEARCH_PAGE_LIMIT, cursor })

export const fetchTrending = () => api.searchTrending()
