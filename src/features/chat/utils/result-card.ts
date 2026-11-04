const KNOWN = ['apply', 'convert', 'view'] as const

export type ResultActionId = (typeof KNOWN)[number]

export type ResultAction = { id: string; label: string; method?: string; path?: string }

type ResultFields = {
  source: 'external' | 'profile'
  actions: ResultAction[]
  fileName?: string
  pageLine?: string
  cardMeta?: string
  name?: string
  title?: string
  subtitle?: string
}

export const resultActions = (card: Pick<ResultFields, 'actions'>) =>
  card.actions.filter((action): action is ResultAction & { id: ResultActionId } => (KNOWN as readonly string[]).includes(action.id))

export const resultButtons = (card: Pick<ResultFields, 'actions'>) => resultActions(card).map((action) => action.label)

export const resultTitle = (card: Pick<ResultFields, 'source' | 'fileName' | 'title'>) =>
  card.source === 'external' ? (card.fileName ?? '') : (card.title ?? '')

export const resultMeta = (card: Pick<ResultFields, 'source' | 'pageLine' | 'cardMeta' | 'subtitle'>) =>
  card.source === 'external' ? (card.cardMeta ?? card.pageLine ?? '') : (card.subtitle ?? '')

const given = (name: string) => (/^[가-힣]{3}$/.test(name) ? name.slice(1) : name.slice(0, 2))

export const resultChrome = (card: Pick<ResultFields, 'source' | 'name'>) =>
  card.source === 'external' ? { share: true as const, initials: null } : { share: false as const, initials: given(card.name ?? '') }
