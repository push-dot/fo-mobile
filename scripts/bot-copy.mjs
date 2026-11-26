#!/usr/bin/env node
// Renames the app's 에이전트 and 봇 copy to the Bot wording the rest of the app uses.
//   node scripts/bot-copy.mjs           rewrite src
//   node scripts/bot-copy.mjs --check   exit 1 and list every line that still says 에이전트 or 봇
// The legal text lives in packages/shared, outside these roots. Its app rendering says Bot; only the web rendering keeps 에이전트.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const OLD = '에이전트'
export const SHORT = '봇'
export const NEW = 'Bot'

// Bot reads 봇. 에이전트 ends in a vowel and 봇 in a consonant, so a particle attached to 에이전트 changes form.
// shortcut: only the particles the app's copy attaches today, add a row when new copy uses another one (라, 랑, 나, 예요).
const PARTICLES = { 가: '이', 를: '을', 는: '은', 와: '과', 로: '으로' }

// 로봇 is a different word.
const PATTERN = new RegExp(`(${OLD}|(?<!로)${SHORT})([${Object.keys(PARTICLES).join('')}]?)`, 'g')

/** @param {string} text */
export const renameCopy = (text) =>
  text.replace(
    PATTERN,
    (_, /** @type {string} */ word, /** @type {keyof typeof PARTICLES | ''} */ particle) =>
      NEW + (word === OLD && particle ? PARTICLES[particle] : particle),
  )

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOTS = ['src']

/** @param {string} dir @returns {string[]} */
const filesUnder = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  )

// These files match 봇 in server bot names, they do not show it as copy.
const KEEP = ['src/features/chat/utils/usage.ts']

const sources = (app = APP) =>
  ROOTS.flatMap((root) => filesUnder(join(app, root))).filter((file) => !KEEP.includes(relative(app, file)))

/** Lines that still say 에이전트 or 봇, as `path:line: text`. */
export const leftovers = (app = APP) =>
  sources(app).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) => (renameCopy(line) !== line ? [`${relative(app, file)}:${i + 1}: ${line.trim()}`] : [])),
  )

/** Rewrites every file under the roots and returns the paths it changed. Running it twice changes nothing. */
export const rename = (app = APP) =>
  sources(app).flatMap((file) => {
    const before = readFileSync(file, 'utf8')
    const after = renameCopy(before)
    if (after === before) return []
    writeFileSync(file, after)
    return [relative(app, file)]
  })

if (process.argv[1] === fileURLToPath(import.meta.url)) {
  if (process.argv.includes('--check')) {
    const left = leftovers()
    left.forEach((line) => console.error(line))
    console.log(left.length ? `${left.length} lines still say ${OLD} or ${SHORT}` : `no ${OLD} or ${SHORT} in ${ROOTS.join(' or ')}`)
    process.exit(left.length ? 1 : 0)
  }
  const changed = rename()
  changed.forEach((file) => console.log(file))
  console.log(`${changed.length} files renamed`)
}
