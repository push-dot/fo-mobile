export const DOC_TITLE_MAX = 40

export const DOC_RENAME_COPY = {
  title: '서류 이름 바꾸기',
  description: '서류 목록과 지원할 때 이 이름으로 보여요.',
  field: '서류 이름',
  placeholder: '서류 이름을 입력하세요',
  clear: '모두 지우기',
  cancel: '취소',
  save: '저장',
  failed: '서류 이름을 바꾸지 못했어요',
} as const

export const titleLength = (title: string) => Array.from(title).length

export const clipTitle = (title: string, max = DOC_TITLE_MAX) => Array.from(title).slice(0, max).join('')

export const renamedTitle = (current: string, typed: string) => {
  const next = typed.trim()
  return next && next !== current ? next : null
}
