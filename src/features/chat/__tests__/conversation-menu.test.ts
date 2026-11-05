import { describe, expect, it } from 'vitest'
import { ARCHIVED_NOTE, ARCHIVED_TITLE, conversationRowMenu, DELETE_CONFIRM, UNARCHIVE_LABEL } from '../utils/conversation-menu'

describe('conversation row menu', () => {
  it('offers pin, archive, and delete', () => {
    expect(conversationRowMenu(false).map((a) => a.label)).toEqual(['이름 바꾸기', '고정', '보관', '삭제'])
    expect(conversationRowMenu(true).map((a) => a.label)).toEqual(['이름 바꾸기', '고정 해제', '보관', '삭제'])
    expect(conversationRowMenu(true)[1]).toMatchObject({ id: 'pin' })
  })

  it('uses the decided delete and archive copy', () => {
    expect(DELETE_CONFIRM).toEqual({
      title: '대화를 삭제할까요?',
      body: '삭제한 대화는 되돌릴 수 없어요.',
      confirm: '삭제',
      cancel: '취소',
    })
    expect(ARCHIVED_TITLE).toBe('보관한 대화')
    expect(UNARCHIVE_LABEL).toBe('보관 해제')
    expect(ARCHIVED_NOTE).toBe('보관을 해제해도 대화에서 쓰던 자료와 첨부는 돌아오지 않아요.')
  })
})
