const isRecord = (value: unknown): value is Record<string, unknown> => typeof value === 'object' && value !== null

const patchList = (list: unknown[], patch: (item: unknown) => unknown) => {
  const next = list.map(patch)
  return next.some((item, i) => item !== list[i]) ? next : list
}

const patchItem = (item: unknown, id: string, bookmarked: boolean) =>
  isRecord(item) && item.id === id && 'bookmarked' in item && item.bookmarked !== bookmarked ? { ...item, bookmarked } : item

const patchEnvelope = (envelope: unknown, id: string, bookmarked: boolean) => {
  if (!isRecord(envelope) || !Array.isArray(envelope.data)) return envelope
  const data = patchList(envelope.data, (item) => patchItem(item, id, bookmarked))
  return data === envelope.data ? envelope : { ...envelope, data }
}

export const patchPostingBookmark = (cached: unknown, id: string, bookmarked: boolean): unknown => {
  if (!isRecord(cached)) return cached
  if (Array.isArray(cached.pages)) {
    const pages = patchList(cached.pages, (page) => patchEnvelope(page, id, bookmarked))
    return pages === cached.pages ? cached : { ...cached, pages }
  }
  if (Array.isArray(cached.data)) return patchEnvelope(cached, id, bookmarked)
  return patchItem(cached, id, bookmarked)
}
