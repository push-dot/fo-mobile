import type { PostingFilters } from '@push/api-client'

export type SectionKind = 'latest' | 'deadline' | 'popular'

export type PostingSort = NonNullable<PostingFilters['sort']>

export type ApplyDoc = { id: string; name: string; note: string; ai: boolean; kind: string | null; date: string | null }

export type ApplyBody = { documentIds: string[]; sourceIds: string[] }
