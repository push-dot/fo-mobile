import { describe, expect, it } from 'vitest'
import { QUICK_STARTS, type QsInput } from '../constants'

const DOC = '11111111-1111-1111-1111-111111111111'

const blank = (): QsInput => ({ picked: [], url: '', chips: [], option: false, task: '', custom: '' })

const start = (key: string, patch: Partial<QsInput> = {}) => QUICK_STARTS.find((q) => q.key === key)!.start({ ...blank(), ...patch })

const job = { id: 'p', over: '모아페이', title: '백엔드' }

describe('quick start intent payloads', () => {
  it('sends match_posting with the url and only a document id', () => {
    expect(start('link', { url: 'https://moapay.com/jobs/1', doc: '이력서.pdf', documentId: DOC })).toEqual({
      title: 'moapay.com 공고 맞춤',
      message: 'https://moapay.com/jobs/1 공고에 맞춰 이력서.pdf를 고쳐 주세요',
      intent: 'match_posting',
      context: { documentId: DOC },
    })
    expect(start('link', { url: 'notaurl', doc: '이력서.pdf' })).toBeFalsy()
  })

  it('sends find_postings in the seed sentence, with a document id only when one is picked', () => {
    expect(start('match', { chips: ['백엔드', '서울'], option: true })).toEqual({
      title: '나에게 맞는 공고',
      message: '백엔드 · 서울 조건으로 공고를 찾아 주세요. 적합도 7점 이상인 공고만 보여 주세요',
      intent: 'find_postings',
    })
    expect(start('match', { chips: ['백엔드'], option: false, documentId: DOC })).toMatchObject({
      intent: 'find_postings',
      message: '백엔드 조건으로 공고를 찾아 주세요',
      context: { documentId: DOC },
    })
  })

  it('sends the resume intents with the picked document id', () => {
    expect(start('gap', { picked: [job], doc: '이력서.pdf', documentId: DOC })).toMatchObject({
      intent: 'gaps',
      message: '모아페이 백엔드 공고와 이력서.pdf를 비교해서 부족한 점을 찾아 주세요',
      context: { documentId: DOC },
    })
    expect(start('fit', { picked: [job], doc: '이력서.pdf', documentId: DOC })).toMatchObject({
      intent: 'fit',
      context: { documentId: DOC },
    })
    expect(start('boost', { picked: [job], doc: '이력서.pdf', documentId: DOC })).toMatchObject({
      intent: 'boost',
      context: { documentId: DOC },
    })
    const made = start('exp', { custom: 'Kafka 운영' })
    expect(made).toMatchObject({
      intent: 'experience',
      message: 'Kafka 운영을 보여 줄 작은 프로젝트를 기획해 주세요',
    })
    expect(made?.context).toBeUndefined()
  })

  it('sends each tool intent in the seed sentence and no extra context keys', () => {
    expect(start('deadline', { picked: [job, { id: 'q', over: '하루랩스', title: 'iOS' }] })).toEqual({
      title: '마감 임박 공고 정리',
      message: '마감 임박 공고 2개(모아페이, 하루랩스)의 준비할 일을 정리해 주세요',
      intent: 'deadline_postings',
    })
    expect(start('status', { picked: [job] })).toMatchObject({
      intent: 'applications',
      message: '모아페이 지원 현황을 정리하고 다음에 할 일을 알려 주세요',
    })
    expect(start('calendar', { task: '이번 주 정리하기', picked: [job] })).toMatchObject({
      intent: 'calendar',
      message: '이번 주 정리하기: 이번 주 일정 1건을 정리해 주세요',
    })
    expect(start('hub', { doc: '이력서.pdf', documentId: DOC, picked: [{ id: 'h', title: '헤드라인' }, { id: 's', title: '소개' }] })).toEqual({
      title: '허브 프로필 다듬기',
      message: '이력서.pdf를 바탕으로 허브 프로필의 헤드라인, 소개을 다듬어 주세요',
      intent: 'hub_profile',
      context: { documentId: DOC },
    })
    expect(start('reply', { picked: [{ id: 'o', title: '오지현', body: '커피챗 어떠세요?' }] })).toMatchObject({
      intent: 'offer_reply',
      message: '오지현 님의 제안 “커피챗 어떠세요?”에 보낼 답장 초안을 써 주세요',
    })
    expect(start('coffee', { picked: [{ id: 'f', title: '이하은' }] })).toMatchObject({
      intent: 'coffee_chat',
      message: '이하은 님에게 보낼 커피챗 제안 글을 써 주세요',
    })
    expect(start('post', { custom: '결제 승인 API p95를 절반 아래로 줄인 이야기' })).toMatchObject({
      intent: 'career_post',
      message: '“결제 승인 API p95를 절반 아래로 줄인 이야기” 커리어 글 초안을 써 주세요',
    })
  })

  it('tells the fit sheet that the score leads into a rewrite', () => {
    expect(QUICK_STARTS.find((q) => q.key === 'fit')!.description).toBe('적합도를 보고, 점수가 오르도록 서류를 고쳐 드려요.')
  })
})
