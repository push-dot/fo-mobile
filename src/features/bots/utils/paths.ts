import type { Attachment, AttachmentKind, BotAddress, BotId } from '../types'

// The only place bot and material route strings are written. Every builder returns a literal type on every
// branch, so typed routes check each one: a bare template string widens to `string` and stops compiling.

/** The bot tab's root. The tab still lives in its `(chat)` group until the bot home replaces it. */
export const botHomePath = '/(app)/(stack)/(tabs)/(chat)/chat' as const
export const botChatPath = (bot: BotAddress) => `/bots/${bot}` as const
/** Opens the chat at one message (a search hit). */
export const botChatAtPath = (id: BotId, messageId: string) => `/bots/${id}?at=${messageId}` as const
export const botProfilePath = (id: BotId) => `/bots/${id}/profile` as const
export const botColorPath = (id: BotId) => `/bots/${id}/color` as const
/** With a posting the sheet opens with it picked (BotNewLinkPicked). */
export const botNewPath = (postingId?: string) => (postingId ? (`/bots/new?posting=${postingId}` as const) : ('/bots/new' as const))
/** The pick sheet of BotPick. The title is read from the materials cache. */
export const botPickPath = (a: Pick<Attachment, 'kind' | 'id'>) => `/bots/pick?kind=${a.kind}&id=${a.id}` as const
/** `forBot`: 보내기 attaches to that bot's composer instead of asking for a bot (MaterialsFromProfile, MaterialsSendHere). */
export const materialsPath = (forBot?: BotId) => (forBot ? (`/materials?for=${forBot}` as const) : ('/materials' as const))
export const materialDetailPath = (kind: AttachmentKind, id: string, forBot?: BotId) =>
  forBot ? (`/materials/${kind}/${id}?for=${forBot}` as const) : (`/materials/${kind}/${id}` as const)
export const materialLinkAddPath = () => '/materials/link-add' as const
/** The 자료 고르기 sheet. Its picks go to that bot's draft. */
export const materialPickerPath = (bot: BotId) => `/material-picker?bot=${bot}` as const
export const accountPath = (page?: 'plan') => (page ? (`/account?page=${page}` as const) : ('/account' as const))
