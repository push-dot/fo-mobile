export const PROFILE_LOADING_LABEL = 'Bot 프로필을 불러오는 중이에요'
export const PROFILE_ERROR_TITLE = 'Bot 정보를 불러오지 못했어요'
export const PROFILE_ERROR_BODY = '인터넷 연결을 확인하고 다시 시도해 주세요.'
export const RETRY_LABEL = '다시 시도'
export const COLOR_TITLE = 'Bot 색'
export const COLOR_ROW = '색'
export const COLOR_A11Y = 'Bot 색 바꾸기'
export const DONE_LABEL = '적용'
export const DELETE_ROW = 'Bot 삭제'
export const DELETE_BODY = '기록이 지워지고 되돌릴 수 없어요.'
export const CANCEL_LABEL = '취소'
export const DELETE_ACTION = '삭제'
export const COMPANIES_ROW = '회사'
export const NOTIFY_LABEL = '알림'
export const POSTING_LABEL = '공고'
export const FIT_LABEL = '적합도'
export const MATERIALS_LABEL = '자료'
// BotProfileAllowed, BotProfileAllowedRevoke
export const ALLOWED_ROW = '허용한 사이트'
export const ALLOWED_BODY = 'Bot이 묻지 않고 읽는 사이트예요.'
export const REVOKE_LABEL = '허용 해제'
export const ALWAYS_LABEL = '상시 채용'

export const deadlineValue = (deadline: Date | null) =>
  deadline === null ? ALWAYS_LABEL : `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`

export const fitValue = (score: number) => String(score)

export const materialValue = (count: number) => `${count}개`

export const companiesValue = (count: number) => `${count}개`

export const companiesTitle = (count: number) => `${COMPANIES_ROW} ${count}개`

export const deleteTitle = (name: string) => `${name} Bot을 삭제할까요?`

export const allowedValue = (count: number) => `${count}개`

export const allowedA11y = (count: number) => `${ALLOWED_ROW} ${count}개`

export const allowedTitle = (count: number) => `${ALLOWED_ROW} ${count}`

const SITE_KIND = { posting: '채용 공고', company: '회사 소개' } as const

/** "11월 3일 허용 · 채용 공고" */
export const allowedLine = (at: Date, kind: keyof typeof SITE_KIND) => `${at.getMonth() + 1}월 ${at.getDate()}일 허용 · ${SITE_KIND[kind]}`

export const revokeA11y = (host: string) => `${host} ${REVOKE_LABEL}`

export const colorA11y = (index: number) => `색 ${index + 1}`

export type ProfileRow =
  | { id: 'posting' | 'fit' | 'materials' | 'allowed' | 'companies'; label: string; value: string }
  | { id: 'color' | 'notify' | 'delete'; label: string }

export const profileGroups = (input: {
  kind: 'push' | 'company'
  posting: { deadline: Date | null } | null
  fitScore: number | null
  materialCount: number | null
  /** Companies the user made documents for, shown on the Push Bot only. Null or 0 hides the row. */
  companyCount?: number | null
  /** Sites the bot reads without asking. Null or 0 hides the row. */
  allowedCount?: number | null
}): ProfileRow[][] => {
  const facts: ProfileRow[] = []
  if (input.posting) facts.push({ id: 'posting', label: POSTING_LABEL, value: deadlineValue(input.posting.deadline) })
  if (input.fitScore != null) facts.push({ id: 'fit', label: FIT_LABEL, value: fitValue(input.fitScore) })
  const docs: ProfileRow[] = []
  if (input.materialCount != null) docs.push({ id: 'materials', label: MATERIALS_LABEL, value: materialValue(input.materialCount) })
  if (input.allowedCount) docs.push({ id: 'allowed', label: ALLOWED_ROW, value: allowedValue(input.allowedCount) })
  if (input.kind === 'push' && input.companyCount) docs.push({ id: 'companies', label: COMPANIES_ROW, value: companiesValue(input.companyCount) })
  const prefs: ProfileRow[] = []
  if (input.kind === 'company') prefs.push({ id: 'color', label: COLOR_ROW })
  prefs.push({ id: 'notify', label: NOTIFY_LABEL })
  const groups = [facts, docs, prefs].filter((group) => group.length > 0)
  if (input.kind === 'company') groups.push([{ id: 'delete', label: DELETE_ROW }])
  return groups
}
