import { monthDay } from '@push/shared'

export const PROFILE_LOADING_LABEL = 'Bot 프로필을 불러오는 중이에요'
export const PROFILE_ERROR_TITLE = 'Bot 정보를 불러오지 못했어요'
export const PROFILE_ERROR_BODY = '인터넷 연결을 확인하고 다시 시도해 주세요.'
export const RETRY_LABEL = '다시 시도'
export const COLOR_TITLE = 'Bot 색'
export const COLOR_ROW = '색'
export const COLOR_A11Y = 'Bot 색 바꾸기'
export const DONE_LABEL = '완료'
export const DELETE_ROW = 'Bot 삭제'
export const DELETE_BODY = '이 Bot과 나눈 대화와 작업 기록이 모두 지워지고 되돌릴 수 없어요. 내 서류에 저장한 파일은 그대로 남아요.'
export const CANCEL_LABEL = '취소'
export const DELETE_ACTION = '삭제'
export const CLOSE_LABEL = '닫기'
export const REVOKE_LABEL = '허용 해제'
export const ALLOWED_ROW = '허용한 사이트'
export const ALLOWED_SHEET_LABEL = '허용한 사이트'
export const COMPANIES_ROW = '회사'
export const NOTIFY_LABEL = '알림'
export const POSTING_LABEL = '공고'
export const FIT_LABEL = '적합도'
export const MATERIALS_LABEL = '자료'
export const ALWAYS_LABEL = '상시 채용'

const KIND_LABEL = { posting: '채용 공고', company: '회사 소개' } as const

export const deadlineValue = (deadline: Date | null) =>
  deadline === null ? ALWAYS_LABEL : `${deadline.getMonth() + 1}월 ${deadline.getDate()}일 마감`

export const fitValue = (score: number) => String(score)

export const materialValue = (count: number) => `${count}개`

export const companiesValue = (count: number) => `${count}개`

export const companiesTitle = (count: number) => `${COMPANIES_ROW} ${count}개`

export const allowedValue = (count: number) => `${count}개`

export const allowedA11y = (count: number) => `${ALLOWED_ROW} ${count}개`

export const allowedSheetTitle = (count: number) => `${ALLOWED_ROW} ${count}`

export const grantMeta = (grantedAt: string, kind: string) => {
  const day = monthDay(grantedAt)
  const when = day ? `${day} 허용` : '허용'
  const label = kind === 'posting' || kind === 'company' ? KIND_LABEL[kind] : null
  return label ? `${when} · ${label}` : when
}

export const GRANT_INTRO = 'Bot이 묻지 않고 읽는 사이트예요.'

export const revokeToast = (host: string) => `${host} 허용을 해제했어요`

export const revokeA11y = (host: string) => `${host} 허용 해제`

export const deleteTitle = (name: string) => `${name} Bot을 삭제할까요?`

export const colorA11y = (index: number) => `색 ${index + 1}`

export type ProfileRow =
  | { id: 'posting' | 'fit' | 'materials' | 'allowed' | 'companies'; label: string; value: string }
  | { id: 'color' | 'notify' | 'delete'; label: string }

export const profileGroups = (input: {
  kind: 'push' | 'company'
  posting: { deadline: Date | null } | null
  fitScore: number | null
  materialCount: number | null
  grantCount: number
  /** Companies the user made documents for, shown on the Push Bot only. Null or 0 hides the row. */
  companyCount?: number | null
}): ProfileRow[][] => {
  const facts: ProfileRow[] = []
  if (input.posting) facts.push({ id: 'posting', label: POSTING_LABEL, value: deadlineValue(input.posting.deadline) })
  if (input.fitScore != null) facts.push({ id: 'fit', label: FIT_LABEL, value: fitValue(input.fitScore) })
  const docs: ProfileRow[] = []
  if (input.materialCount != null) docs.push({ id: 'materials', label: MATERIALS_LABEL, value: materialValue(input.materialCount) })
  if (input.grantCount > 0) docs.push({ id: 'allowed', label: ALLOWED_ROW, value: allowedValue(input.grantCount) })
  if (input.kind === 'push' && input.companyCount) docs.push({ id: 'companies', label: COMPANIES_ROW, value: companiesValue(input.companyCount) })
  const prefs: ProfileRow[] = []
  if (input.kind === 'company') prefs.push({ id: 'color', label: COLOR_ROW })
  prefs.push({ id: 'notify', label: NOTIFY_LABEL })
  const groups = [facts, docs, prefs].filter((group) => group.length > 0)
  if (input.kind === 'company') groups.push([{ id: 'delete', label: DELETE_ROW }])
  return groups
}
