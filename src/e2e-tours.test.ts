import fs from 'node:fs'
import { createRequire } from 'node:module'
import path from 'node:path'
import { describe, expect, it } from 'vitest'

// js-yaml is not a direct dependency: it comes with eslint (a devDependency), so resolve it from there.
const require = createRequire(import.meta.url)
const yaml = require(require.resolve('js-yaml', { paths: [require.resolve('eslint')] })) as {
  loadAll: (src: string) => unknown[]
}

const ROOT = path.resolve(path.dirname(new URL(import.meta.url).pathname), '..', '.maestro')

const listYaml = (dir: string): string[] =>
  fs.readdirSync(dir, { withFileTypes: true }).flatMap((e) => {
    const p = path.join(dir, e.name)
    return e.isDirectory() ? listYaml(p) : e.name.endsWith('.yaml') ? [p] : []
  })

describe('Maestro tours', () => {
  it('every .maestro yaml file parses (an unquoted value ending in a colon breaks a whole run)', () => {
    const broken: string[] = []
    for (const file of listYaml(ROOT)) {
      try {
        yaml.loadAll(fs.readFileSync(file, 'utf8'))
      } catch (e) {
        const mark = (e as { mark?: { line: number }; reason?: string }).mark
        const reason = (e as { reason?: string }).reason ?? String(e)
        broken.push(`${path.relative(ROOT, file)}:${mark ? mark.line + 1 : '?'} ${reason}`)
      }
    }
    expect(broken).toEqual([])
  })
})
