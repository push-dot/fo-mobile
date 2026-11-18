import { brandColor } from '@push/shared'
import { givenName } from '@/features/my/utils/given-name'

const KNOWN = ['apply', 'convert', 'view'] as const

export type ResultActionId = (typeof KNOWN)[number]

export type ResultAction = { id: string; label: string; method?: string; path?: string }

type ResultFields = {
  source: 'external' | 'profile'
  actions: ResultAction[]
  fileName?: string
  pageLine?: string
  cardMeta?: string
  savedLine?: string
  name?: string
  title?: string
  subtitle?: string
  documentId?: string
}

export const resultActions = (card: Pick<ResultFields, 'actions'>) =>
  card.actions.filter((action): action is ResultAction & { id: ResultActionId } => (KNOWN as readonly string[]).includes(action.id))

export const resultActionsFor = (card: Pick<ResultFields, 'actions'> & { pendingNote?: string }, awaiting?: boolean) =>
  card.pendingNote || awaiting ? [] : resultActions(card)

export const applyText = (company?: string) => (company ? `${company}에 바로 지원해 줘` : '바로 지원해 줘')

export const resultButtons = (card: Pick<ResultFields, 'actions'>) => resultActions(card).map((action) => action.label)

/**
 * The chat room holds no action buttons (ChatDoneNext): a finished run asks what to do next in an action sheet.
 * 프로필 보기 is not offered there; the profile card itself opens the profile.
 */
export const doneNextActions = (card: Pick<ResultFields, 'actions'> & { pendingNote?: string }) =>
  resultActionsFor(card).filter((action) => action.id !== 'view')

export const DONE_NEXT_TITLE = '다음으로 무엇을 할까요?'

/** The server sends savedLine with an external file it saved; no line means the save failed (ChatPh6ResultFail). */
export const saveFailed = (card: Pick<ResultFields, 'source' | 'savedLine'>) => card.source === 'external' && !card.savedLine

export const SAVE_FAIL_TEXT = '내 서류에 저장하지 못했어요. 네트워크를 확인해 주세요.'
export const SAVE_RETRY_LABEL = '다시 저장하기'
/** What 다시 저장하기 sends: the bot saves the file it just made. */
export const SAVE_RETRY_TEXT = '내 서류에 저장해 줘'

export const PROFILE_SAVE_TITLE = 'Push 프로필에 저장했어요'

/** Pre-confirm profile card. Absent note keeps the normal title and actions. */
export const profileSaveCopy = (card: { pendingNote?: string; actions: ResultAction[] }) =>
  card.pendingNote
    ? { title: PROFILE_SAVE_TITLE, body: card.pendingNote, buttons: ['프로필 보기'] as const }
    : null

export const resultTitle = (card: Pick<ResultFields, 'source' | 'fileName' | 'title'> & { pendingNote?: string }) => {
  if (card.pendingNote) return PROFILE_SAVE_TITLE
  if (card.source === 'external') return card.fileName ?? ''
  return card.title ?? ''
}

export const resultMeta = (card: Pick<ResultFields, 'source' | 'pageLine' | 'cardMeta' | 'subtitle'>) =>
  card.source === 'external' ? (card.pageLine ?? card.cardMeta ?? '') : (card.subtitle ?? '')

/** 공유 sends the saved document's PDF export, so a card whose document was not saved has nothing to share. */
export const resultChrome = (card: Pick<ResultFields, 'source' | 'name' | 'documentId'>) =>
  card.source === 'external'
    ? { share: !!card.documentId, initials: null, color: null }
    : { share: false, initials: givenName(card.name ?? ''), color: brandColor(card.name ?? '') }

/** 프로필 수정 · Push 프로필 · 경력 → the tool line above the card. */
export const resultTask = (taskLine: string) => {
  const [action = '', ...rest] = taskLine.split(' · ')
  return { action, target: rest.length ? rest.join(' · ') : undefined }
}
