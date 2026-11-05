import type { ChatDoc } from '../api/schemas'

/** Real-mode doc row. AI origin is the same check the web apply sheet uses. */
export const chatDocFromSource = (s: { id: string; fileName: string; size: number; createdAt: string | null; origin: string }): ChatDoc => ({
  id: s.id,
  fileName: s.fileName,
  size: s.size,
  createdAt: s.createdAt ?? new Date().toISOString(),
  aiMade: s.origin === 'AI',
})
