import type { Bot } from '../../types'

export const companyNames = (bots: readonly Bot[] | undefined): string[] => [
  ...new Set((bots ?? []).flatMap((bot) => (bot.kind === 'company' ? [bot.name] : []))),
]
