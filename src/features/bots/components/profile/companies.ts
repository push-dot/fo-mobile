import type { Bot } from '../../types'

/** The companies the user has a Bot for, each once and in list order: the companies Push made documents for. */
export const companyNames = (bots: readonly Bot[] | undefined): string[] => [
  ...new Set((bots ?? []).flatMap((bot) => (bot.kind === 'company' ? [bot.name] : []))),
]
