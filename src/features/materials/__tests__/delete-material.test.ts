import { MutationObserver, QueryClient } from '@tanstack/react-query'
import { describe, expect, it } from 'vitest'
import type { Material, MaterialKind, MaterialsPage } from '../types'
import { deleteOptions, LISTS, type Pages } from '../api/cache'

const day = new Date(2026, 10, 2)
const one: Record<MaterialKind, Material> = {
  file: { kind: 'file', id: 'f1', title: 'a.pdf', mimeType: 'application/pdf', bytes: 1, pages: 1, madeBy: { by: 'user' }, updatedAt: day },
  document: { kind: 'document', id: 'd1', title: '기본 이력서', docKind: 'RESUME', madeBy: { by: 'user' }, updatedAt: day },
  posting: { kind: 'posting', id: 'p1', title: '백엔드', company: '모아페이', deadline: null, closed: false, careerMin: null, careerMax: null, employmentType: null, location: null, bookmarkedAt: day },
  link: { kind: 'link', id: 'l1', title: 'gh', url: 'https://github.com/a', linkKind: 'github', addedAt: day, lastCheck: null },
}

const listed = (): MaterialsPage => ({
  counts: { doc: 2, bookmark: 1, link: 1 },
  sections: [
    { section: 'doc', items: [one.file, one.document], hasMore: false },
    { section: 'bookmark', items: [one.posting], hasMore: false },
    { section: 'link', items: [one.link], hasMore: false },
  ],
})
const pages = (): Pages => ({ pages: [{ page: listed(), next: null }], pageParams: [undefined] })

const ids = (qc: QueryClient, tab: string) => qc.getQueryData<Pages>([...LISTS, tab, '', undefined])!.pages[0]!.page.sections.flatMap((s) => s.items.map((m) => m.id))

const seeded = () => {
  const qc = new QueryClient()
  qc.setQueryData([...LISTS, 'all', '', undefined], pages())
  qc.setQueryData([...LISTS, 'doc', '', undefined], pages())
  return qc
}

describe('deleting a material from the modal', () => {
  it.each(Object.keys(one) as MaterialKind[])('takes a %s out of every list while the server works, and keeps it out when it agrees', async (kind) => {
    const qc = seeded()
    let agree!: () => void
    const observer = new MutationObserver(qc, deleteOptions(qc, () => new Promise<void>((resolve) => (agree = resolve))))
    const done = observer.mutate({ kind, id: one[kind].id })
    await Promise.resolve()
    await new Promise((r) => setTimeout(r, 0))
    expect(ids(qc, 'all')).not.toContain(one[kind].id)
    expect(ids(qc, 'doc')).not.toContain(one[kind].id)
    agree()
    await done
    expect(ids(qc, 'all')).not.toContain(one[kind].id)
  })

  it.each(Object.keys(one) as MaterialKind[])('puts every list back as it was when the server refuses a %s', async (kind) => {
    const qc = seeded()
    const observer = new MutationObserver(qc, deleteOptions(qc, () => Promise.reject(new Error('409'))))
    await observer.mutate({ kind, id: one[kind].id }).catch(() => undefined)
    expect(qc.getQueryData([...LISTS, 'all', '', undefined])).toEqual(pages())
    expect(qc.getQueryData([...LISTS, 'doc', '', undefined])).toEqual(pages())
  })

  it('counts the section one less while the row is out', async () => {
    const qc = seeded()
    const observer = new MutationObserver(qc, deleteOptions(qc, () => new Promise(() => undefined)))
    void observer.mutate({ kind: 'file', id: 'f1' })
    await new Promise((r) => setTimeout(r, 0))
    expect(qc.getQueryData<Pages>([...LISTS, 'all', '', undefined])!.pages[0]!.page.counts).toEqual({ doc: 1, bookmark: 1, link: 1 })
  })
})
