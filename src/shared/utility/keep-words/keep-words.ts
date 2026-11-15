// Rule 5: a word the boards keep whole (WebKit keep-all) is not broken at its middle dot, its brackets, its hyphens, or where Latin or digits
// meet Hangul ("payment-retry-lab을"). TextKit breaks at those spots, so a line could start with "을" or "·정산". A word joiner (U+2060) forbids the break there only.
export const WORD_JOINER = '\u2060'
const WJ = WORD_JOINER
const HANGUL = '가-힣'
const LATIN = 'A-Za-z0-9'

export const keepWordsWhole = (s: string) =>
  s
    .replace(/([^\s\u2060])\(/g, `$1${WJ}(`)
    .replace(/\)(?=[^\s\u2060])/g, `)${WJ}`)
    .replace(/([^\s·\u2060])·(?=[^\s·])/g, `$1${WJ}·${WJ}`)
    .replace(new RegExp(`([${LATIN}])-(?=[${LATIN}])`, 'g'), `$1${WJ}-${WJ}`)
    .replace(new RegExp(`([${LATIN}])(?=[${HANGUL}])|([${HANGUL}])(?=[${LATIN}])`, 'g'), (_, latin, hangul) => `${latin ?? hangul}${WJ}`)

/** keepWordsWhole over text that a caller lays out as several nested Text nodes: a joiner at a seam goes to the start of the next part. */
export const keepPartsWhole = (parts: readonly string[]) => {
  const whole = keepWordsWhole(parts.join(''))
  let at = 0
  return parts.map((part) => {
    let out = ''
    for (let seen = 0; seen < part.length; ) {
      if (whole[at] === WJ && part[seen] !== WJ) out += whole[at++]
      else {
        out += whole[at++]
        seen++
      }
    }
    return out
  })
}
