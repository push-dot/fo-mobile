import type { ProfileDraft } from '@push/api-client'
import type { ResumeDraft } from '../types'

export const toResumeDraft = (d: ProfileDraft): ResumeDraft => ({
  pageCount: null,
  email: null,
  links: [],
  profile: {
    displayName: d.displayName,
    headline: d.headline,
    jobCategory: null,
    tenureYears: d.tenureYears,
    intro: d.intro,
    careers: d.careers.map((c) => ({
      company: c.company,
      role: c.title,
      startedOn: c.start,
      endedOn: c.end || null,
      description: '',
    })),
    skills: d.skills,
  },
})
