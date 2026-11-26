import type { BotAddress } from '../types'

export const botAddressParam = (value: unknown): BotAddress => (typeof value === 'string' ? value : 'push') as BotAddress
