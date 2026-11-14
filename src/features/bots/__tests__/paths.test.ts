import { existsSync, readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import type { BotId } from '../types'
import {
  accountPath,
  botChatAtPath,
  botChatPath,
  botColorPath,
  botHomePath,
  botNewPath,
  botPickPath,
  botProfilePath,
  materialDetailPath,
  materialLinkAddPath,
  materialPickerPath,
  materialsPath,
} from '../utils/paths'

type Push = typeof import('expo-router').router.push

const id = 'b1' as BotId

// Never called. `typecheck` compiles it against the generated typed routes, so a builder whose route file is gone,
// or one that widens to `string`, fails there.
export const everyBuilderCompiles = (push: Push) => {
  push(botHomePath)
  push(botChatPath(id))
  push(botChatPath('push'))
  push(botChatAtPath(id, 'm1'))
  push(botProfilePath(id))
  push(botColorPath(id))
  push(botNewPath())
  push(botNewPath('p1'))
  push(botPickPath({ kind: 'file', id: 'f1' }))
  push(materialsPath())
  push(materialsPath(id))
  push(materialDetailPath('file', 'f1'))
  push(materialDetailPath('link', 'l1', id))
  push(materialLinkAddPath())
  push(materialPickerPath(id))
  push(accountPath())
  push(accountPath('plan'))
  // @ts-expect-error a route that does not exist. If typed routes were not generated, this line would compile.
  push('/no-such-route')
  const widened = (page?: 'plan') => (page ? `/plan?page=${page}` : '/account')
  // @ts-expect-error a builder without literal types widens to string
  push(widened('plan'))
}

const STACK = join(__dirname, '../../../app/(app)/(stack)')
const layout = readFileSync(join(STACK, '_layout.tsx'), 'utf8')

describe('bot and material routes', () => {
  // Route file, and how the stack presents it (routes.ts in the design).
  it.each([
    [botChatPath(id), 'bots/[botId]/index', null],
    [botProfilePath(id), 'bots/[botId]/profile', null],
    [botColorPath(id), 'bots/[botId]/color', '{sheetOptions(c)}'],
    [botNewPath('p1'), 'bots/new', '{modalOptions(c)}'],
    [botPickPath({ kind: 'file', id: 'f1' }), 'bots/pick', '{sheetOptions(c)}'],
    [materialsPath(id), 'materials/index', '{modalOptions(c)}'],
    [materialDetailPath('posting', 'p1'), 'materials/[kind]/[id]', '{sheetOptions(c)}'],
    [materialLinkAddPath(), 'materials/link-add', '{sheetOptions(c)}'],
    [materialPickerPath(id), 'material-picker', '{sheetOptions(c)}'],
    [accountPath(), 'account', '{modalOptions(c)}'],
    [accountPath('plan'), 'plan', '{fullPageOptions()}'],
  ])('%s opens %s', (_href, route, options) => {
    expect(existsSync(join(STACK, `${route}.tsx`))).toBe(true)
    expect(layout).toContain(options ? `name="${route}" options=${options}` : `name="${route}" />`)
  })

  it('carries what the next screen needs in the query', () => {
    expect(botNewPath('p1')).toBe('/bots/new?posting=p1')
    expect(botPickPath({ kind: 'link', id: 'l1' })).toBe('/bots/pick?kind=link&id=l1')
    expect(materialDetailPath('file', 'f1', id)).toBe('/materials/file/f1?for=b1')
    expect(materialPickerPath(id)).toBe('/material-picker?bot=b1')
  })
})
