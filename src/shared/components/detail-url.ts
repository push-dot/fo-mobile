import { isXlBoardText } from './xl-scale'

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

/** The `.xl` text rules of the job detail boards (JobDetailXL): drawn in fixed pixels, so each rule also drops the system inflation for its own element. */
const XL_BOARD_RULES = [
  '.h1{font-size:34px;line-height:44px}',
  '.h2{font-size:26px;line-height:34px}',
  '.h3{font-size:22px;line-height:30px}',
  '.b1{font-size:21px;line-height:30px}',
  '.b2{font-size:20px;line-height:28px}',
  '.c1{font-size:17px;line-height:24px}',
  '.c2{font-size:16px;line-height:22px}',
  '.btn{height:auto;min-height:56px;padding:12px 20px;font-size:22px;line-height:30px}',
  '.btn.sm{min-height:44px;font-size:18px}',
  '.chip{height:auto;min-height:40px;padding:8px 16px;font-size:18px;line-height:24px}',
  '.badge{height:auto;min-height:26px;padding:2px 8px;font-size:15px;line-height:22px}',
  '.frow{font-size:17px;line-height:24px;grid-template-columns:110px minmax(0,1fr) 40px}',
]
  .map((rule) => `html.push-xl ${rule.slice(0, -1)};-webkit-text-size-adjust:100%!important}`)
  .join('')

/** fo-web sets text-size-adjust on body, so an inline value on html never reached the text. From the harness XL size the page also takes the board's `.xl` sizes. */
export const textSizeScript = (percent: number) =>
  `(function(){var s=document.getElementById('push-text-size');if(!s){s=document.createElement('style');s.id='push-text-size';document.documentElement.appendChild(s)}s.textContent='html,body{-webkit-text-size-adjust:${percent}%!important}${isXlBoardText(percent / 100) ? XL_BOARD_RULES : ''}';document.documentElement.classList.toggle('push-xl',${isXlBoardText(percent / 100)})})();true;`

/** Mock only (JobFit): fo-web answers the fit in a WebView after `setTimeout(resolve, 0)` set from fit-card.tsx, so a zero-delay timer set by that file waits 60 s (fo-web runs unminified from its dev server, so the file is in the stack). Timers set deeper, such as the mock data loader's, are left alone: holding those blanks the whole page. */
export const HOLD_FIT_SCRIPT =
  "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){var rest=Array.prototype.slice.call(arguments,2);var top=(new Error().stack||'').split('\\n').slice(0,3).join('\\n');return st.apply(window,[f,ms===0&&/fit-card/.test(top)?60000:ms].concat(rest))}})();"

/** Mock only (JobDetailStates): the fit card reads `mockFit.score` once the document is known, so a getter that throws turns the fit request into an error and the card says 적합도는 곧 볼 수 있어요 with the document and three dashes. fo-web runs from its dev server, so the mock module has a stable URL and this import gets the page's own instance. */
export const SOON_FIT_SCRIPT =
  "import(location.origin+'/src/shared/api/mock.ts').then(function(m){Object.defineProperty(m.mockFit,'score',{get:function(){throw new Error('mock fit soon')},configurable:true})});"

const originOf = (url: string) => /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(url)?.[0].toLowerCase() ?? null

/** Only fo-web itself may load in the WebView: the page gets the session token, and react-native-webview's originWhitelist matches by prefix. */
export const loadsInWebView = (url: string, base: string) => url === 'about:blank' || originOf(url) === originOf(base)

/** Where a navigation goes: fo-web loads in place, other http(s) pages open in the system browser, everything else (intent:, push:, tel:, javascript:) is dropped. */
export const webViewNavigation = (url: string, base: string): 'load' | 'browser' | 'ignore' =>
  loadsInWebView(url, base) ? 'load' : /^https?:\/\//i.test(url) ? 'browser' : 'ignore'

/** Whether the WebView loads the navigation; an http(s) page elsewhere goes to `open`, and a browser that fails to open shows nothing. */
export const routeNavigation = (url: string, base: string, open: (url: string) => Promise<void>) => {
  const target = webViewNavigation(url, base)
  if (target === 'browser') open(url).catch(() => undefined)
  return target === 'load'
}

const onWebOrigin = (base: string, script: string) => `if(location.origin===${JSON.stringify(originOf(base))}){${script}}true;`

export const bootScript = (base: string, env: Record<string, unknown>, extra = '') =>
  onWebOrigin(base, `window.__PUSH__=${JSON.stringify(env)};${extra}`)

export const tokenEventScript = (base: string, token: string | null) =>
  onWebOrigin(base, `window.dispatchEvent(new CustomEvent('push:token',{detail:{token:${JSON.stringify(token)}}}));`)
