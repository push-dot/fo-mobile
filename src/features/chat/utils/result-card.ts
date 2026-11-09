import { brandColor } from '@push/shared'

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
  documentId?: string
}

export const resultActions = (card: Pick<ResultFields, 'actions'>) =>
  card.actions.filter((action): action is ResultAction & { id: ResultActionId } => (KNOWN as readonly string[]).includes(action.id))

export const RESULT_VARIANT: Record<ResultActionId, 'primary' | 'secondary'> = { apply: 'primary', convert: 'secondary', view: 'secondary' }

export const resultActionsFor = (card: Pick<ResultFields, 'actions'> & { pendingNote?: string }, awaiting?: boolean) =>
  card.pendingNote || awaiting ? [] : resultActions(card)

export const applyText = (company?: string) => (company ? `${company}에 바로 지원해 줘` : '바로 지원해 줘')

export const resultButtons = (card: Pick<ResultFields, 'actions'>) => resultActions(card).map((action) => action.label)

export const PROFILE_SAVE_TITLE = 'Push 프로필에 저장했어요'

/** Pre-confirm profile card. Absent note keeps the normal title and actions. */
export const profileSaveCopy = (card: { pendingNote?: string; actions: ResultAction[] }) =>
  card.pendingNote
    ? { title: PROFILE_SAVE_TITLE, body: card.pendingNote, buttons: ['프로필 보기'] as const }
    : null

export const resultTitle = (card: Pick<ResultFields, 'source' | 'fileName' | 'title'> & { pendingNote?: string }) =>
  card.pendingNote ? PROFILE_SAVE_TITLE : card.source === 'external' ? (card.fileName ?? '') : (card.title ?? '')

export const resultMeta = (card: Pick<ResultFields, 'source' | 'pageLine' | 'cardMeta' | 'subtitle'>) =>
  card.source === 'external' ? (card.cardMeta ?? card.pageLine ?? '') : (card.subtitle ?? '')

const given = (name: string) => (/^[가-힣]{3}$/.test(name) ? name.slice(1) : name.slice(0, 2))

/** 공유 sends the saved document's PDF export, so a card whose document was not saved has nothing to share. */
export const resultChrome = (card: Pick<ResultFields, 'source' | 'name' | 'documentId'>) =>
  card.source === 'external'
    ? { share: !!card.documentId, initials: null, color: null }
    : { share: false, initials: given(card.name ?? ''), color: brandColor(card.name ?? '') }

/** 프로필 수정 · Push 프로필 · 경력 → the tool line above the card. */
export const resultTask = (taskLine: string) => {
  const [action = '', ...rest] = taskLine.split(' · ')
  return { action, target: rest.length ? rest.join(' · ') : undefined }
}
