import { describe, expect, it } from 'vitest'
import { dayBreaks, eventWhen, fitTen, hubProfile, nextEventFor, personLine, stageSteps } from './index'

const doc = (...nodes: unknown[]) => ({ type: 'doc', content: nodes })
const h = (text: string) => ({ type: 'heading', attrs: { level: 2 }, content: [{ type: 'text', text }] })
const p = (text: string) => ({ type: 'paragraph', content: [{ type: 'text', text }] })
const list = (...items: string[]) => ({
  type: 'bulletList',
  content: items.map((text) => ({ type: 'listItem', content: [p(text)] })),
})

describe('my detail rules', () => {
  it('shows the 0–100 application fit score out of 10', () => {
    expect(fitTen(69)).toBe('6.9')
    expect(fitTen(80)).toBe('8.0')
    expect(fitTen(null)).toBe('')
    expect(fitTen(undefined)).toBe('')
  })

  it('reads a Push 서류 into profile sections the way push-be does', () => {
    const profile = hubProfile(
      doc(
        h('헤드라인'),
        p('대규모 결제 트래픽을 견디는 서버를 만들어요'),
        h('소개'),
        p('결제 승인과 정산 서버를 4년째 만들고 있어요.'),
        h('경력'),
        list(
          '모아페이 | 백엔드 엔지니어 | 2022-03-01 |  | 결제 승인 API를 다시 설계했어요.',
          '하루랩스 | 서버 개발자 | 2021-01-01 | 2022-02-28',
        ),
        h('기술 스택'),
        p('Kotlin, Spring Boot · Kafka'),
        h('프로젝트'),
        p('정산 배치 개선'),
      ),
    )
    expect(profile).toEqual({
      headline: '대규모 결제 트래픽을 견디는 서버를 만들어요',
      intro: '결제 승인과 정산 서버를 4년째 만들고 있어요.',
      careers: [
        { company: '모아페이', role: '백엔드 엔지니어', startedOn: '2022-03-01', endedOn: null, description: '결제 승인 API를 다시 설계했어요.' },
        { company: '하루랩스', role: '서버 개발자', startedOn: '2021-01-01', endedOn: '2022-02-28', description: '' },
      ],
      skills: ['Kotlin', 'Spring Boot', 'Kafka'],
    })
  })

  it('treats a Push 서류 without headings as an intro', () => {
    expect(hubProfile(doc(p('첫 줄'), p('• 둘째 줄')))).toEqual({
      headline: '',
      intro: '첫 줄\n둘째 줄',
      careers: [],
      skills: [],
    })
    expect(hubProfile(undefined)).toEqual({ headline: '', intro: '', careers: [], skills: [] })
  })

  it('puts a day line before the first message of each day', () => {
    const at = (d: number, hh: number) => new Date(2026, 9, d, hh).toISOString()
    expect(
      dayBreaks([{ createdAt: at(20, 1) }, { createdAt: at(20, 9) }, { createdAt: at(21, 10) }]).map((m) => m.day),
    ).toEqual(['10월 20일', null, '10월 21일'])
  })

  it('marks the application stages up to the current one with the applied date', () => {
    expect(stageSteps('INTERVIEW', new Date(2026, 9, 14, 10).toISOString())).toEqual([
      { label: '지원', date: '10.14', state: 'done' },
      { label: '서류 통과', date: null, state: 'done' },
      { label: '면접', date: null, state: 'now' },
      { label: '결과', date: null, state: 'todo' },
    ])
    expect(stageSteps('APPLIED', null).map((s) => s.state)).toEqual(['now', 'todo', 'todo', 'todo'])
  })

  it('names when the next event starts', () => {
    const now = new Date(2026, 9, 20, 9)
    expect(eventWhen(new Date(2026, 9, 21, 15).toISOString(), now)).toBe('내일 오후 3:00')
    expect(eventWhen(new Date(2026, 9, 20, 11, 30).toISOString(), now)).toBe('오늘 오전 11:30')
    expect(eventWhen(new Date(2026, 9, 23, 14).toISOString(), now)).toBe('10월 23일 오후 2:00')
  })

  it('names an offer person by company and headline', () => {
    expect(personLine({ companyName: '모아페이', headline: '결제 플랫폼팀 채용 담당' })).toBe('모아페이 · 결제 플랫폼팀 채용 담당')
    expect(personLine({ companyName: null, headline: '' })).toBe('')
    expect(personLine({})).toBe('')
  })

  it('picks the earliest event of the application', () => {
    const ev = (id: string, applicationId: string | null, startsAt: string) => ({ id, applicationId, startsAt })
    expect(
      nextEventFor([ev('x', 'a2', '2026-10-20'), ev('late', 'a1', '2026-10-25'), ev('soon', 'a1', '2026-10-21')], 'a1')?.id,
    ).toBe('soon')
    expect(nextEventFor([ev('x', null, '2026-10-20')], 'a1')).toBeNull()
  })
})
