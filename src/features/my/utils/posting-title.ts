export const postingTitleLines = (title: string): string[] => {
  const at = title.indexOf(' (')
  return at > 0 ? [title.slice(0, at), title.slice(at + 1)] : [title]
}
