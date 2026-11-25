import type { Attachment, AttachmentKind, BotAddress, BotId } from '../types'


export const botHomePath = '/(app)/(stack)/(tabs)/(bots)/bots' as const
export const botChatPath = (bot: BotAddress) => `/bots/${bot}` as const
export const botChatAtPath = (id: BotId, messageId: string) => `/bots/${id}?at=${messageId}` as const
export const botProfilePath = (id: BotId) => `/bots/${id}/profile` as const
export const botCompaniesPath = (id: BotId) => `/bots/${id}/companies` as const
export const botAllowedPath = (id: BotId) => `/bots/${id}/allowed` as const
export const botColorPath = (id: BotId) => `/bots/${id}/color` as const
export const botNewPath = (postingId?: string) => (postingId ? (`/bots/new?posting=${postingId}` as const) : ('/bots/new' as const))
export const botPickPath = (a: Pick<Attachment, 'kind' | 'id'>) => `/materials/pick?kind=${a.kind}&id=${a.id}` as const
export const materialsPath = (forBot?: BotId) => (forBot ? (`/materials?for=${forBot}` as const) : ('/materials' as const))
export const materialDetailPath = (kind: AttachmentKind, id: string, forBot?: BotId) =>
  forBot ? (`/materials/${kind}/${id}?for=${forBot}` as const) : (`/materials/${kind}/${id}` as const)
export const materialLinkAddPath = () => '/materials/link-add' as const
export const materialCreateBotPath = () => '/materials/create-pick' as const
export const materialPickerPath = (bot: BotId) => `/material-picker?bot=${bot}` as const
export const accountPath = (page?: 'plan') => (page ? ('/plan' as const) : ('/account' as const))
