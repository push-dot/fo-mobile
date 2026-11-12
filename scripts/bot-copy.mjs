#!/usr/bin/env node
// Renames the app's 에이전트 copy to the boards' 봇 wording.
//   node scripts/bot-copy.mjs           rewrite src and .maestro
//   node scripts/bot-copy.mjs --check   exit 1 and list every line that still says 에이전트
// The legal text keeps 에이전트. It lives in packages/shared, outside these roots.
import { readdirSync, readFileSync, writeFileSync } from 'node:fs'
import { dirname, join, relative } from 'node:path'
import { fileURLToPath } from 'node:url'

export const OLD = '에이전트'
export const NEW = '봇'

// 에이전트 ends in a vowel and 봇 in a consonant, so a particle attached to it changes form.
// shortcut: only the particles the app's copy attaches today, add a row when new copy uses another one (라, 랑, 나, 예요).
const PARTICLES = { 가: '이', 를: '을', 는: '은', 와: '과', 로: '으로' }

const PATTERN = new RegExp(`${OLD}([${Object.keys(PARTICLES).join('')}]?)`, 'g')

/** @param {string} text */
export const renameCopy = (text) =>
  text.replace(PATTERN, (_, /** @type {keyof typeof PARTICLES | ''} */ particle) => NEW + (particle ? PARTICLES[particle] : ''))

const APP = join(dirname(fileURLToPath(import.meta.url)), '..')
const ROOTS = ['src', '.maestro']

/** @param {string} dir @returns {string[]} */
const filesUnder = (dir) =>
  readdirSync(dir, { withFileTypes: true }).flatMap((entry) =>
    entry.isDirectory() ? filesUnder(join(dir, entry.name)) : [join(dir, entry.name)],
  )

const sources = (app = APP) => ROOTS.flatMap((root) => filesUnder(join(app, root)))

/** Lines that still say 에이전트, as `path:line: text`. */
export const leftovers = (app = APP) =>
  sources(app).flatMap((file) =>
    readFileSync(file, 'utf8')
      .split('\n')
      .flatMap((line, i) => (line.includes(OLD) ? [`${relative(app, file)}:${i + 1}: ${line.trim()}`] : [])),
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
    console.log(left.length ? `${left.length} lines still say ${OLD}` : `no ${OLD} in ${ROOTS.join(' or ')}`)
    process.exit(left.length ? 1 : 0)
  }
  const changed = rename()
  changed.forEach((file) => console.log(file))
  console.log(`${changed.length} files renamed`)
}
