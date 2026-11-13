import { useInfiniteQuery, useMutation, useQuery, useQueryClient } from '@tanstack/react-query'
import type { MaterialKind, MaterialsFilter, MaterialsPage } from '../types'
import { deleteOptions, LISTS, MATERIALS, type Pages } from './cache'
import { deleteMaterial, fetchMaterial, fetchMaterials, restoreMaterial } from './fetchers'

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

export const useMaterials = ({ tab, q, bot }: MaterialsFilter) => {
  const r = useInfiniteQuery({
    queryKey: [...LISTS, tab, q.trim(), bot],
    queryFn: ({ pageParam }) => fetchMaterials({ tab, q: q.trim(), bot }, pageParam),
    initialPageParam: undefined as string | undefined,
    getNextPageParam: (last) => last.next ?? undefined,
    // Bots add materials while the modal is closed, so each open asks again; the rows on hand show meanwhile.
    staleTime: 0,
    // A new search word keeps the rows on screen until its answer comes; a new tab starts from its own skeleton.
    placeholderData: (prev, prevQuery) => (prevQuery?.queryKey[2] === tab ? prev : undefined),
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
  return { data: r.data, isLoading: r.isLoading, isError: r.isError, refetch: () => void r.refetch() }
}

// The 마이 tabs list the same files, documents, bookmarks, and links, so they reload after a change made here.
const MY_LISTS = [['me'], ['documents']] as const

/** Lists reload after a material is added elsewhere (a link, an upload) or comes back. */
export const useRefreshMaterials = () => {
  const qc = useQueryClient()
  return () => {
    void qc.invalidateQueries({ queryKey: MATERIALS })
    MY_LISTS.forEach((queryKey) => void qc.invalidateQueries({ queryKey }))
  }
}

export const useDeleteMaterial = () => {
  const qc = useQueryClient()
  const refresh = useRefreshMaterials()
  const m = useMutation({ ...deleteOptions(qc, deleteMaterial), onSettled: refresh })
  return async (kind: MaterialKind, id: string) => void (await m.mutateAsync({ kind, id }))
}

/** 되돌리기 on the delete toast. The lists refetch, so the row comes back in its place. */
export const useRestoreMaterial = () => {
  const refresh = useRefreshMaterials()
  const m = useMutation({ mutationFn: ({ kind, id }: { kind: MaterialKind; id: string }) => restoreMaterial(kind, id), onSettled: refresh })
  return async (kind: MaterialKind, id: string) => void (await m.mutateAsync({ kind, id }))
}
