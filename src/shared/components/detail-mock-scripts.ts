// Mock-only WebView scripts: loaded only when API_MOCK is on.

/** Mock only (JobFit): fo-web answers the fit in a WebView after `setTimeout(resolve, 0)` set from fit-card.tsx, so a zero-delay timer set by that file waits 60 s (fo-web runs unminified from its dev server, so the file is in the stack). Timers set deeper, such as the mock data loader's, are left alone: holding those blanks the whole page. */
export const HOLD_FIT_SCRIPT =
  "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){var rest=Array.prototype.slice.call(arguments,2);var top=(new Error().stack||'').split('\\n').slice(0,3).join('\\n');return st.apply(window,[f,ms===0&&/fit-card/.test(top)?60000:ms].concat(rest))}})();"

/** Mock only (JobDetailStates): the fit card reads `mockFit.score` once the document is known, so a getter that throws turns the fit request into an error and the card says 적합도는 곧 볼 수 있어요 with the document and three dashes. fo-web runs from its dev server, so the mock module has a stable URL and this import gets the page's own instance. */
export const SOON_FIT_SCRIPT =
  "import(location.origin+'/src/shared/api/mock.ts').then(function(m){Object.defineProperty(m.mockFit,'score',{get:function(){throw new Error('mock fit soon')},configurable:true})});"
