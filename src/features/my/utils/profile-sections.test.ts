import { describe, expect, it } from 'vitest'
import { overwriteWarning, profilePatch, profileSections, replacedLabels } from './index'

const draft = {
  displayName: '김서준',
  headline: '결제 시스템을 만드는 백엔드 개발자',
  jobCategory: null,
  tenureYears: 4,
  intro: '결제 시스템을 만드는 4년차 백엔드 개발자예요.',
  careers: [
    { company: '모아페이', role: '백엔드 엔지니어', startedOn: '2022-03', endedOn: null, description: '' },
    { company: '하루랩스', role: '서버 개발자', startedOn: '2021-01', endedOn: '2022-02', description: '' },
  ],
  skills: ['Kotlin', 'Spring Boot', 'Kafka', 'MySQL', 'Redis', 'JPA', 'Java'],
}

describe('profile sections from a resume', () => {
  it('lists the four sections with the artboard summaries and skills unchecked', () => {
    expect(profileSections(draft)).toEqual([
      { key: 'basic', label: '기본 정보', on: true, sub: '이름 · 헤드라인 · 4년차' },
      { key: 'intro', label: '소개', on: true, sub: draft.intro },
      { key: 'career', label: '경력', on: true, sub: '모아페이, 하루랩스 · 2건' },
      { key: 'skills', label: '기술 스택', on: false, sub: 'Kotlin, Spring Boot 외 5개' },
    ])
  })

  it('hides a section the resume has nothing for', () => {
    expect(profileSections({ ...draft, skills: [], intro: '' }).map((s) => s.key)).toEqual(['basic', 'career'])
  })

  it('patches only the picked sections', () => {
    expect(profilePatch(draft, ['intro', 'career'])).toEqual({ intro: draft.intro, careers: draft.careers })
  })

  it('warns only about picked sections that would replace different existing content', () => {
    const current = { ...draft, intro: '예전 소개', careers: [], skills: ['Go'] }
    const labels = replacedLabels(draft, current, ['basic', 'intro', 'career'])
    expect(labels).toEqual(['소개'])
    expect(overwriteWarning(replacedLabels(draft, { ...current, careers: [draft.careers[0]!] }, ['basic', 'intro', 'career']))).toBe(
      '지금 프로필의 소개와 경력은 이 내용으로 바뀌어요.',
    )
  })
})
