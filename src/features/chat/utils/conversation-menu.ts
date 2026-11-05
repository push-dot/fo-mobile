export type RowAction = 'rename' | 'pin' | 'archive' | 'delete'
export type HeaderAction = 'rename' | 'docs' | 'share' | 'pin' | 'archive' | 'delete'

export const headerMenu = (pinned: boolean): { id: HeaderAction; label: string; destructive?: boolean }[] => [
  { id: 'rename', label: '이름 바꾸기' },
  { id: 'docs', label: '쓴 서류·공고 보기' },
  { id: 'share', label: '대화 공유' },
  { id: 'pin', label: pinned ? '고정 해제' : '고정' },
  { id: 'archive', label: '보관' },
  { id: 'delete', label: '대화 삭제', destructive: true },
]

export const conversationRowMenu = (pinned: boolean): { id: RowAction; label: string; destructive?: boolean }[] => [
  { id: 'rename', label: '이름 바꾸기' },
  { id: 'pin', label: pinned ? '고정 해제' : '고정' },
  { id: 'archive', label: '보관' },
  { id: 'delete', label: '삭제', destructive: true },
]

export const DELETE_CONFIRM = {
  title: '대화를 삭제할까요?',
  body: '삭제한 대화는 되돌릴 수 없어요.',
  confirm: '삭제',
  cancel: '취소',
} as const

export const ARCHIVED_TITLE = '보관한 대화'
export const UNARCHIVE_LABEL = '보관 해제'
export const ARCHIVED_NOTE = '보관을 해제해도 대화에서 쓰던 자료와 첨부는 돌아오지 않아요.'
