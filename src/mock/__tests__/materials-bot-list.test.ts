import { describe, expect, it } from 'vitest'
import { mockFetch } from '../server'
import '../bots'
import '../materials'

type Page = { counts: { doc: number; bookmark: number; link: number }; sections: { section: string; items: { title: string }[] }[] }
const page = async (path: string) => ((await (await mockFetch(new Request(`http://x/api/v1/${path}`))).json()) as { data: Page }).data

describe('materials of a bot (MaterialsFromProfile)', () => {
  it('lists 서류 4 / 북마크 1 / 링크 3 for 모아페이, the first row the 지원동기 draft', async () => {
    const data = await page('materials?bot=b-moa')
    expect(data.counts).toEqual({ doc: 4, bookmark: 1, link: 3 })
    expect(data.sections[0]!.items.map((m) => m.title)).toEqual(['모아페이_지원동기_초안.pdf', '김서준_백엔드_이력서.pdf', '경력기술서_2026.pdf', '포트폴리오_결제시스템.pdf'])
  })

  it('keeps the 서류 board as drawn: no 지원동기 draft, 면접_예상질문 still there', async () => {
    const data = await page('materials?tab=doc&limit=20')
    expect(data.counts.doc).toBe(7)
    const titles = data.sections[0]!.items.map((m) => m.title)
    expect(titles).not.toContain('모아페이_지원동기_초안.pdf')
    expect(titles).toContain('면접_예상질문_모아페이.pdf')
  })
})
