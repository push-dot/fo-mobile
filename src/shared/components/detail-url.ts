/** Which list opened the page: the same fo-web route draws a different board for each. */
export type DetailFrom = 'following' | 'bookmark'

const FROMS: readonly string[] = ['following', 'bookmark']

export const detailFrom = (value: string | string[] | undefined): DetailFrom | undefined => {
  const v = Array.isArray(value) ? value[0] : value
  return v && FROMS.includes(v) ? (v as DetailFrom) : undefined
}

/** WebView query: theme always, mock only when the mock API is on, from only when a list opened the page. */
export const detailUrl = (base: string, path: string, theme: 'light' | 'dark', mock: boolean, from?: DetailFrom) => {
  const query = new URLSearchParams()
  query.set('theme', theme)
  if (mock) query.set('mock', '1')
  if (from) query.set('from', from)
  return `${base}${path}?${query.toString()}`
}

/** fo-web sets text-size-adjust on body, so an inline value on html never reached the text. */
export const textSizeScript = (percent: number) =>
  `(function(){var s=document.getElementById('push-text-size');if(!s){s=document.createElement('style');s.id='push-text-size';document.documentElement.appendChild(s)}s.textContent='html,body{-webkit-text-size-adjust:${percent}%!important}'})();true;`

/** Mock only (JobFit): fo-web answers the fit in a WebView after `setTimeout(resolve, 0)` inside loadMockFit, so a zero-delay timer set from loadMockFit waits 60 s (fo-web runs unminified from its dev server, so the name is in the stack). */
export const HOLD_FIT_SCRIPT =
  "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){var rest=Array.prototype.slice.call(arguments,2);return st.apply(window,[f,ms===0&&/loadMockFit/.test(new Error().stack||'')?60000:ms].concat(rest))}})();"
