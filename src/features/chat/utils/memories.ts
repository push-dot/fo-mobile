export const MEMORY_MAX = 300

export const MEMORIES_COPY = {
  title: '기억',
  intro: 'Bot이 대화하면서 기억해 둔 내용이에요. 모든 Bot이 함께 봐요.',
  emptyTitle: '아직 기억한 내용이 없어요',
  emptyBody: '원하는 조건이나 취향을 말해 주면 Bot이 기억해 둬요.',
  failed: '기억을 불러오지 못했어요.',
  retry: '다시 시도',
  editHint: '눌러서 고치거나 지울 수 있어요.',
  save: '저장',
  cancel: '취소',
  remove: '지우기',
  clear: '모두 지우기',
  clearTitle: '기억을 모두 지울까요?',
  clearBody: '지운 기억은 되돌릴 수 없어요.',
} as const

export const memoryCount = (rows?: readonly unknown[]) => (rows ? `${rows.length}개` : undefined)

export const memoryDraft = (text: string, original: string) => {
  const next = text.trim()
  return next && next.length <= MEMORY_MAX && next !== original ? next : null
}
