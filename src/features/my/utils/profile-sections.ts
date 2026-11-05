import { JOB_CATEGORIES, type Profile } from '@push/api-client'
import type { ResumeDraft } from '../types'
import { tenureLabel } from './tenure-label'

type Draft = ResumeDraft['profile']
type Current = Pick<Profile, keyof Draft>

const SECTIONS = [
  {
    key: 'basic',
    label: '기본 정보',
    on: true,
    fields: ['displayName', 'headline', 'jobCategory', 'tenureYears'],
    sub: (d: Draft) =>
      ['이름', '헤드라인', [JOB_CATEGORIES.find((j) => j.key === d.jobCategory)?.label, tenureLabel(d.tenureYears)].filter(Boolean).join(' ')]
        .filter(Boolean)
        .join(' · '),
  },
  { key: 'intro', label: '소개', on: true, fields: ['intro'], sub: (d: Draft) => d.intro },
  {
    key: 'career',
    label: '경력',
    on: true,
    fields: ['careers'],
    sub: (d: Draft) => (d.careers.length ? `${d.careers.map((c) => c.company).join(', ')} · ${d.careers.length}건` : ''),
  },
  {
    key: 'skills',
    label: '기술 스택',
    on: false,
    fields: ['skills'],
    sub: (d: Draft) => d.skills.slice(0, 2).join(', ') + (d.skills.length > 2 ? ` 외 ${d.skills.length - 2}개` : ''),
  },
] as const satisfies readonly { key: string; label: string; on: boolean; fields: readonly (keyof Draft)[]; sub: (d: Draft) => string }[]

export type ProfileSectionKey = (typeof SECTIONS)[number]['key']

const filled = (v: unknown) => (Array.isArray(v) ? v.length > 0 : v != null && v !== '')

export const profileSections = (draft: Draft) =>
  SECTIONS.filter((s) => s.fields.some((f) => filled(draft[f]))).map((s) => ({ key: s.key, label: s.label, on: s.on, sub: s.sub(draft) }))

export const profilePatch = (draft: Draft, picked: readonly ProfileSectionKey[]): Partial<Profile> =>
  Object.fromEntries(SECTIONS.filter((s) => picked.includes(s.key)).flatMap((s) => s.fields.map((f) => [f, draft[f]])))

export const replacedLabels = (draft: Draft, current: Current | undefined, picked: readonly ProfileSectionKey[]) =>
  SECTIONS.filter(
    (s) =>
      picked.includes(s.key) &&
      s.fields.some((f) => filled(current?.[f]) && JSON.stringify(current?.[f]) !== JSON.stringify(draft[f])),
  ).map((s) => s.label)
