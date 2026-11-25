import type { InfiniteData, MutationOptions, QueryClient } from '@tanstack/react-query'
import type { MaterialKind, MaterialsPage } from '../types'
import { withoutMaterial } from './material-row'


export type ListPage = { page: MaterialsPage; next: string | null }
export type Pages = InfiniteData<ListPage, string | undefined>
export type Target = { kind: MaterialKind; id: string }

export const MATERIALS = ['materials'] as const
export const LISTS = [...MATERIALS, 'list'] as const

export const deleteOptions = (
  qc: QueryClient,
  remove: (kind: MaterialKind, id: string) => Promise<unknown>,
): MutationOptions<unknown, Error, Target, [readonly unknown[], Pages | undefined][]> => ({
  mutationFn: ({ kind, id }) => remove(kind, id),
  onMutate: async ({ kind, id }) => {
    await qc.cancelQueries({ queryKey: LISTS })
    const before = qc.getQueriesData<Pages>({ queryKey: LISTS })
    qc.setQueriesData<Pages>({ queryKey: LISTS }, (prev) => prev && { ...prev, pages: prev.pages.map((p) => ({ ...p, page: withoutMaterial(p.page, kind, id) })) })
    return before
  },
  onError: (_error, _target, before) => before?.forEach(([key, data]) => qc.setQueryData(key, data)),
})
