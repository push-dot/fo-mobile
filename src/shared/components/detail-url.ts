/** WebView query: theme always, mock only when the mock API is on. No other params. */
export const detailUrl = (base: string, path: string, theme: 'light' | 'dark', mock: boolean) => {
  const query = new URLSearchParams()
  query.set('theme', theme)
  if (mock) query.set('mock', '1')
  return `${base}${path}?${query.toString()}`
}
