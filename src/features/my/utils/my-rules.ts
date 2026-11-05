import type { Settings } from '@push/api-client'
import { MAX_BYTES } from '../constants'
import { fitTen } from './fit-ten'

const MB = 1024 * 1024

const hasBatchim = (word: string) => {
  const code = word.charCodeAt(word.length - 1) - 0xac00
  return code >= 0 && code <= 11171 && code % 28 !== 0
}

const objectParticle = (word: string) => (hasBatchim(word) ? '을' : '를')

export const skillOrderHint = '길게 누르면 앞으로 옮겨요. 앞의 5개가 허브 목록에 보여요.'

export const profileCountLabels = (profile: {
  followingCount?: number
  followerCount?: number
  postCount?: number
}) => ({
  following: { count: profile.followingCount ?? 0, label: '팔로잉' },
  followers: { count: profile.followerCount ?? 0, label: '팔로워' },
  posts: { count: profile.postCount ?? 0, label: '게시글' },
})

export const deleteDocCopy = (fileName: string) => ({
  title: '이 서류를 삭제할까요?',
  body: `${fileName}${objectParticle(fileName)} 서류에서 지워요. 이 서류로 지원한 기록은 남아요.`,
  confirm: '삭제',
  cancel: '취소',
  toast: '서류를 삭제했어요',
  undo: '되돌리기',
})

export const careerDeleteCopy = {
  title: '이 경력을 삭제할까요?',
  confirm: '삭제',
  toast: '경력을 삭제했어요',
  undo: '되돌리기',
} as const

export const careerDeleteBody = (career: { company: string; role: string }) => {
  const name = [career.company.trim(), career.role.trim()].filter(Boolean).join(' · ')
  return `${name || '이'} 경력을 프로필에서 지워요.`
}

export const SIZE_LIMIT = {
  title: `${MAX_BYTES / MB}MB까지 올릴 수 있어요`,
  body: '크기를 줄여서 다시 올려 주세요.',
  footnote: 'PDF, DOCX 파일을 20MB까지 올릴 수 있어요.',
} as const

export const profileConvertBody = () => ({})

export const SET_BASE_COPY = {
  action: '기본 프로필로 설정',
  title: '이 프로필을 기본 프로필로 설정할까요?',
  body: '허브에 보이는 내 프로필이 이 내용으로 바뀌어요.',
  confirm: '설정',
  cancel: '취소',
  toast: '기본 프로필로 설정했어요.',
} as const

export const setBaseProfilePath = (id: string) => `documents/${id}/base-profile`

export const followSeeAll = (count: number) => `${count}명 전체 보기 ›`
export const followerSee = (count: number) => `팔로워 ${count}명 보기 ›`
export const postsSeeAll = (count: number) => `${count}개 전체 보기 ›`
export const commentedSee = (count: number) => `댓글 단 글 ${count}개 보기 ›`
export const pushSeeAll = (count: number) => `전체 ${count}개 보기`

export const followMatches = <T extends { displayName: string; headline: string }>(people: T[], query: string) => {
  const needle = query.trim().toLocaleLowerCase()
  if (!needle) return people
  return people.filter(
    (person) =>
      person.displayName.toLocaleLowerCase().includes(needle) || person.headline.toLocaleLowerCase().includes(needle),
  )
}

export const emptyCta = (tab: 'applications' | 'bookmarks' | 'follows' | 'posts') => {
  if (tab === 'follows') {
    return { title: '아직 팔로우한 사람이 없어요.', action: '허브 둘러보기', href: '/hub' as const }
  }
  if (tab === 'posts') return { title: '아직 쓴 글이 없어요.', action: '글쓰기', href: '/compose' as const }
  if (tab === 'bookmarks') {
    return { title: '북마크한 공고가 없어요.', action: '채용공고 보기', href: '/jobs' as const }
  }
  return { title: '아직 지원한 공고가 없어요.', action: '채용공고 보기', href: '/jobs' as const }
}

export const showViewCount = (surface: 'feed' | 'detail' | 'my-posts' | 'my-all') => surface !== 'feed'

const STAGE_LABELS = ['지원', '서류 통과', '면접', '결과'] as const

export const stageFlow = (stage: string) => {
  if (stage === 'SCREENING') return { step: 1, headline: '서류 통과', labels: STAGE_LABELS }
  if (stage === 'INTERVIEW') return { step: 2, headline: '면접 진행 중', labels: STAGE_LABELS }
  if (stage === 'OFFER' || stage === 'ACCEPTED') return { step: 3, headline: '합격', labels: STAGE_LABELS }
  if (stage === 'REJECTED' || stage === 'WITHDRAWN') return { step: 3, headline: '불합격', labels: STAGE_LABELS }
  return { step: 0, headline: '지원함', labels: STAGE_LABELS }
}

export const INTERVIEW_PREP = 'Push 에이전트로 면접 준비'
export const FIX_DOC = '이 서류를 고쳐 줘'
export const CALENDAR_ADD = '일정 추가하기'
export const OFFER_DECLINE = '거절'
export const OFFER_FAIL = '잠시 뒤에 다시 보내 주세요.'
export const OFFER_FAIL_TITLE = '메시지를 보내지 못했어요'
export const OFFER_FAIL_LINE = `${OFFER_FAIL_TITLE}. ${OFFER_FAIL}`
export const OFFER_EMPTY_ACTION = '허브 프로필 다듬기'
export const RETRY_LABEL = '다시 시도'
export const PUSH_DOCS_TITLE = 'Push 서류'
export const UPLOADS_TITLE = '올린 파일'

export const NOTIFICATION_ROWS: { key: keyof Pick<Settings, 'notifyDeadline' | 'notifyOffer' | 'notifyComment' | 'notifyAiDone' | 'notifyApplicationStage'>; label: string }[] = [
  { key: 'notifyDeadline', label: '마감 임박 공고' },
  { key: 'notifyOffer', label: '제안 받음' },
  { key: 'notifyComment', label: '댓글과 답글' },
  { key: 'notifyAiDone', label: '에이전트 작업 완료' },
  { key: 'notifyApplicationStage', label: '지원 상태 변경' },
]

export const AGENT_TITLE = '에이전트'
export const AGENT_NOTE = '마이 › 서류와 북마크 공고를 에이전트가 읽어서 이력서를 고쳐요. 끄면 매번 직접 첨부해야 해요.'
export const REFERENCE_LABEL = '참고 데이터 제공'
export const REFERENCE_SUB = '에이전트를 쓰려면 켜 두어야 해요'

export { THEME_CHOICES, themeMode, type ThemeChoice } from '../../../theme/mode'

export const hideCompanyLabel = (company: string) => `${company || '지금 다니는 회사'} 사람에게 숨기기`

export const WITHDRAW_BODY =
  '구독은 탈퇴해도 자동으로 해지되지 않아요. App Store나 Google Play에서 직접 해지해 주세요. 30일 안에 다시 로그인하면 계정이 복구되고, 30일이 지나면 이력서·서류·글·댓글이 모두 삭제돼요. 삭제된 뒤에는 되돌릴 수 없어요.'

export const PREVIEW_HEADINGS = ['경력', '프로젝트', '기술 스택'] as const

export const pushCardLines = (
  doc: { title: string },
  application: { company: string; title: string; fitScore?: number | null } | null,
) =>
  application
    ? { title: application.title, company: application.company, score: fitTen(application.fitScore), doc: doc.title }
    : { title: doc.title, company: '', score: '', doc: '' }
