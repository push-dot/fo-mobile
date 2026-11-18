import { searchHangul } from '@push/shared'

/** EditSkills (board): 3 rows under the field, the better match first, then the shorter name ("Re" → Redis, React, Rest Docs). */
export const SKILL_SUGGESTION_LIMIT = 3

export const skillSuggestions = (catalog: readonly string[], query: string) =>
  searchHangul([...catalog], query, (s) => [s])
    .sort((a, b) => (a.match?.rank ?? 0) - (b.match?.rank ?? 0) || a.item.length - b.item.length)
    .slice(0, SKILL_SUGGESTION_LIMIT)
