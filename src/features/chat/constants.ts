import type { AccessMode } from '@push/api-client'

export const ACCESS_MODES: { key: AccessMode; label: string; desc: string }[] = [
  { key: 'ALWAYS_ASK', label: '항상 묻기', desc: '바꾸기 전에 매번 물어봐요' },
  { key: 'AUTO', label: '자동', desc: '나만 바뀌는 일은 바로 하고, 다른 사람에게 닿는 일은 물어봐요' },
  { key: 'BYPASS', label: '바로 실행', desc: '묻지 않고 실행해요' },
]
export const DEFAULT_ACCESS_MODE: AccessMode = 'AUTO'
export const ACCESS_MODE_TITLE = 'AI가 어떻게 실행할까요?'

export const MICRO_CREDITS_PER_CREDIT = 6000

export const SAY_LABEL = '직접 말하기'
export const CHOICE_QUESTION = '어떻게 할까요?'

export const AWAITING_TEXT = { approval: '확인을 기다리고 있어요', choice: '선택을 기다리고 있어요' } as const

export const FIT_ROWS = [
  { key: 'techStack', label: '기술 스택' },
  { key: 'experienceLink', label: '경험 연관성' },
  { key: 'keyword', label: '키워드' },
] as const

const CREDITS_TEXT = '크레딧이 모자라요. 요금제에서 충전할 수 있어요.'
export const ERROR_TEXT: Record<string, string> = {
  FEATURE_DISABLED: CREDITS_TEXT,
  INSUFFICIENT_CREDITS: CREDITS_TEXT,
  PLAN_REQUIRED: '요금제를 올리면 쓸 수 있어요.',
  QUEUE_BUSY: '지금 요청이 많아요. 잠시 뒤에 다시 보내 주세요.',
  INTEGRATION_REQUIRED: 'AI 키를 연결해야 쓸 수 있어요.',
  APPROVAL_ALREADY_RESOLVED: '이미 답한 요청이에요.',
  APPROVAL_EXPIRED: '시간이 지나서 답할 수 없어요. 다시 보내 주세요.',
}
export const DEFAULT_ERROR_TEXT = '작업을 이어가지 못했어요. 다시 보내 주세요.'
export const queueBusyText = (sec: number) => `지금 요청이 많아요. ${sec}초 뒤에 다시 보내 주세요.`
