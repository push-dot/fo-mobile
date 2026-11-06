/** WebView query: theme always, mock only when the mock API is on. No other params. */
export const detailUrl = (base: string, path: string, theme: 'light' | 'dark', mock: boolean) => {
  const query = new URLSearchParams()
  query.set('theme', theme)
  if (mock) query.set('mock', '1')
  return `${base}${path}?${query.toString()}`
}

/** fo-web sets text-size-adjust on body, so an inline value on html never reached the text. */
export const textSizeScript = (percent: number) =>
  `(function(){var s=document.getElementById('push-text-size');if(!s){s=document.createElement('style');s.id='push-text-size';document.documentElement.appendChild(s)}s.textContent='html,body{-webkit-text-size-adjust:${percent}%!important}'})();true;`
