import { isXlBoardText } from './xl-scale'

export type DetailFrom = 'following' | 'bookmark'

const FROMS: readonly string[] = ['following', 'bookmark']

export const detailFrom = (value: string | string[] | undefined): DetailFrom | undefined => {
  const v = Array.isArray(value) ? value[0] : value
  return v && FROMS.includes(v) ? (v as DetailFrom) : undefined
}

export const detailUrl = (base: string, path: string, theme: 'light' | 'dark', mock: boolean, from?: DetailFrom) => {
  const query = new URLSearchParams()
  query.set('theme', theme)
  if (mock) query.set('mock', '1')
  if (from) query.set('from', from)
  return `${base}${path}?${query.toString()}`
}

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

export const textSizeScript = (percent: number) =>
  `(function(){var s=document.getElementById('push-text-size');if(!s){s=document.createElement('style');s.id='push-text-size';document.documentElement.appendChild(s)}s.textContent='html,body{-webkit-text-size-adjust:${percent}%!important}${isXlBoardText(percent / 100) ? XL_BOARD_RULES : ''}';document.documentElement.classList.toggle('push-xl',${isXlBoardText(percent / 100)})})();true;`

export const originOf = (url: string) => /^[a-z][a-z0-9+.-]*:\/\/[^/?#]*/i.exec(url)?.[0].toLowerCase() ?? null

export const loadsInWebView = (url: string, base: string) => url === 'about:blank' || originOf(url) === originOf(base)

export const webViewNavigation = (url: string, base: string): 'load' | 'browser' | 'ignore' =>
  loadsInWebView(url, base) ? 'load' : /^https?:\/\//i.test(url) ? 'browser' : 'ignore'

export const routeNavigation = (url: string, base: string, open: (url: string) => Promise<void>) => {
  const target = webViewNavigation(url, base)
  if (target === 'browser') open(url).catch(() => undefined)
  return target === 'load'
}

const onWebOrigin = (base: string, script: string) => `if(location.origin===${JSON.stringify(originOf(base))}){${script}}true;`

export const bootScript = (base: string, env: Record<string, unknown>, extra = '') => {
  const { token: _token, ...safe } = env
  return onWebOrigin(base, `window.__PUSH__=${JSON.stringify(safe)};${extra}`)
}

export const tokenEventScript = (base: string, token: string | null) =>
  onWebOrigin(base, `window.dispatchEvent(new CustomEvent('push:token',{detail:{token:${JSON.stringify(token)}}}));`)
