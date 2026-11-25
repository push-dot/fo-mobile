
export const HOLD_FIT_SCRIPT =
  "(function(){var st=window.setTimeout;window.setTimeout=function(f,ms){var rest=Array.prototype.slice.call(arguments,2);var top=(new Error().stack||'').split('\\n').slice(0,3).join('\\n');return st.apply(window,[f,ms===0&&/fit-card/.test(top)?60000:ms].concat(rest))}})();"

export const SOON_FIT_SCRIPT =
  "import(location.origin+'/src/shared/api/mock.ts').then(function(m){Object.defineProperty(m.mockFit,'score',{get:function(){throw new Error('mock fit soon')},configurable:true})});"
