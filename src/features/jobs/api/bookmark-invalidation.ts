type BookmarkInvalidator = { invalidateQueries: (arg: { queryKey: string[] }) => Promise<unknown> }

export const invalidateAfterPostingBookmarkToggle = (qc: BookmarkInvalidator) =>
  Promise.all([
    qc.invalidateQueries({ queryKey: ['postings'] }),
    qc.invalidateQueries({ queryKey: ['search', 'postings'] }),
    qc.invalidateQueries({ queryKey: ['me', 'bookmarks'] }),
    qc.invalidateQueries({ queryKey: ['calendar'] }),
  ])
