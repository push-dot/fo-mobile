import { describe, expect, it } from 'vitest'
import {
  ACCESS_MODE_TITLE,
  ACCOUNT_REFERENCE_NOTE,
  ACCOUNT_REFERENCE_TITLE,
  BOOKMARK_EMPTY,
  CONSENT_BODY,
  CONSENT_TITLE,
  LINK_ADD_NOTE,
  LINK_DELETED_TOAST,
  LINK_EMPTY,
  LINK_UNDO,
  MENTION_SHORTCUT_KEYS,
  PLAN_FOOTER,
  PLAN_HEADER,
  docAiSub,
  QUICK_STARTS,
  linkDeleteBody,
  linkMentionSub,
} from '../constants'
import { conversationRowMenu, headerMenu } from '../utils/conversation-menu'

describe('agent s copy', () => {
  it('access mode title', () => {
    expect(ACCESS_MODE_TITLE).toBe('에이전트가 어떻게 실행할까요?')
  })

  it('consent title and body', () => {
    expect(CONSENT_TITLE).toBe('에이전트를 쓰려면\n동의가 필요해요')
    expect(CONSENT_BODY).toBe('내 서류와 평가 결과를 가공해 다른 사용자와 기업의 에이전트가 참고 자료로 써요.')
    expect(CONSENT_BODY).not.toContain('기업의 AI')
  })

  it('plan header and footer', () => {
    expect(PLAN_HEADER).toBe('요금제마다\n쓸 수 있는 양이 달라요')
    expect(PLAN_FOOTER).toEqual(['매월 1일에 사용량이 다시 채워져요.', '언제든 해지할 수 있어요'])
    expect(ACCOUNT_REFERENCE_TITLE).toBe('에이전트가 참고하는 내 정보')
    expect(ACCOUNT_REFERENCE_NOTE).toBe('대화를 시작할 때 에이전트가 이 정보부터 읽어요.')
  })

  it('link delete body', () => {
    expect(linkDeleteBody('모아페이 · 결제 플랫폼 시니어 엔지니어')).toBe('모아페이 · 결제 플랫폼 시니어 엔지니어 링크를 내 링크에서 지워요.')
    expect(LINK_EMPTY).toBe('아직 모아 둔 링크가 없어요.')
    expect(LINK_ADD_NOTE).toBe('추가하면 에이전트가 README와 커밋을 읽어 둬요')
    expect(LINK_DELETED_TOAST).toBe('링크를 삭제했어요')
    expect(LINK_UNDO).toBe('되돌리기')
    expect(BOOKMARK_EMPTY).toBe('북마크한 공고가 없어요.')
  })

  it('mention shortcuts are three', () => {
    const labels = QUICK_STARTS.filter((q) => (MENTION_SHORTCUT_KEYS as readonly string[]).includes(q.key)).map((q) => q.label)
    expect(labels).toEqual(['공고 링크로 맞추기', '부족한 점 찾기', '적합도 보기'])
    expect(docAiSub('방금')).toBe('에이전트로 만듦 · 방금')
    expect(linkMentionSub('공고', 'https://careers.moapay.kr/jobs/1182')).toBe('공고 · careers.moapay.kr/jobs/1182')
  })
})

describe('conversation menus', () => {
  it('header menu order', () => {
    expect(headerMenu(false).map((a) => a.label)).toEqual(['이름 바꾸기', '쓴 서류·공고 보기', '대화 공유', '고정', '보관', '대화 삭제'])
    expect(headerMenu(true)[3]!.label).toBe('고정 해제')
    expect(headerMenu(false).filter((a) => a.label !== '고정').map((a) => a.label)).toEqual(headerMenu(true).filter((a) => a.label !== '고정 해제').map((a) => a.label))
  })

  it('context menu includes rename', () => {
    expect(conversationRowMenu(false).map((a) => a.label)).toEqual(['이름 바꾸기', '고정', '보관', '삭제'])
    expect(conversationRowMenu(true)[1]!.label).toBe('고정 해제')
  })
})
