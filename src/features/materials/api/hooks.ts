import { useInfiniteQuery, useMutation, useQuery, useQueryClient, type InfiniteData } from '@tanstack/react-query'
import type { MaterialKind, MaterialsPage, MaterialTab } from '../types'
import { withoutMaterial } from '../utils/material-row'
import { deleteMaterial, fetchMaterial, fetchMaterials } from './fetchers'

type Pages = InfiniteData<Awaited<ReturnType<typeof fetchMaterials>>, string | undefined>

const MATERIALS = ['materials'] as const
const LISTS = [...MATERIALS, 'list'] as const

/** Pages of one tab joined into one MaterialsPage. Counts come from the first page, which the search filters too. */
const joined = (data: Pages): MaterialsPage => {
  const [first, ...rest] = data.pages.map((p) => p.page)
  if (!first) return { counts: { doc: 0, bookmark: 0, link: 0 }, sections: [] }
  return {
    counts: first.counts,
    sections: first.sections.map((s, i) => ({
      ...s,
      items: [...s.items, ...rest.flatMap((p) => p.sections[i]?.items ?? [])],
      hasMore: data.pages[data.pages.length - 1]?.page.sections[i]?.hasMore ?? false,
    })),
  }
}

export const useMaterials = ({ tab, q }: { tab: MaterialTab; q: string }) => {
  const r = useInfiniteQuery({
    queryKey: [...LISTS, tab, q.trim()],
    queryFn: ({ pageParam }) => fetchMaterials(tab, q.trim(), pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    select: joined,
  })
  return {
    data: r.data,
    isLoading: r.isLoading,
    isError: r.isError,
    refetch: () => void r.refetch(),
    loadMore: () => void (r.hasNextPage && !r.isFetchingNextPage && r.fetchNextPage()),
  }
}

export const useMaterialDetail = (kind: MaterialKind, id: string) => {
  const r = useQuery({ queryKey: [...MATERIALS, 'detail', kind, id], queryFn: () => fetchMaterial(kind, id) })
  return { data: r.data, isLoading: r.isLoading, isError: r.isError }
}

/** The row leaves every list at once and comes back if the server refuses. */
export const useDeleteMaterial = () => {
  const qc = useQueryClient()
  const m = useMutation({
    mutationFn: ({ kind, id }: { kind: MaterialKind; id: string }) => deleteMaterial(kind, id),
    onMutate: async ({ kind, id }) => {
      await qc.cancelQueries({ queryKey: LISTS })
      const before = qc.getQueriesData<Pages>({ queryKey: LISTS })
      qc.setQueriesData<Pages>({ queryKey: LISTS }, (prev) => prev && { ...prev, pages: prev.pages.map((p) => ({ ...p, page: withoutMaterial(p.page, kind, id) })) })
      return before
    },
    onError: (_error, _vars, before) => before?.forEach(([key, data]) => qc.setQueryData(key, data)),
    onSettled: () => qc.invalidateQueries({ queryKey: MATERIALS }),
  })
  return async (kind: MaterialKind, id: string) => void (await m.mutateAsync({ kind, id }))
}
