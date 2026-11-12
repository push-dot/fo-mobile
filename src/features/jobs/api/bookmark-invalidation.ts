type BookmarkInvalidator = { invalidateQueries: (arg: { queryKey: string[] }) => Promise<unknown> }

export const invalidateAfterPostingBookmarkToggle = (qc: BookmarkInvalidator) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ['postings'] }),
    // Only posting rows show a bookmark; search counts and trending would refetch for nothing.
    qc.invalidateQueries({ queryKey: ['search', 'postings'] }),
    qc.invalidateQueries({ queryKey: ['me', 'bookmarks'] }),
  ])
