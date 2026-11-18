import { clipTitle } from './doc-title'

/** push-be takes 1-300 characters for a document title. */
const TITLE_MAX = 300
const COPY_SUFFIX = ' 사본'

export const DOC_COPY_COPY = { done: '서류를 복제했어요', failed: '서류를 복제하지 못했어요' } as const

type CopySource = { applicationId: string | null; title: string; kind: string; template?: string; language?: string }
type CopyBlock = { id: string; text: string; evidenceRefs?: unknown }

export const copyTitle = (title: string) => `${clipTitle(title, TITLE_MAX - Array.from(COPY_SUFFIX).length)}${COPY_SUFFIX}`

/** POST documents body of a copy: same posting, kind, template and language, under the copy's title. */
export const copyBody = (doc: CopySource) => ({
  applicationId: doc.applicationId,
  title: copyTitle(doc.title),
  kind: doc.kind,
  template: doc.template || 'SIMPLE',
  language: doc.language || 'ko',
})

/** POST documents/:id/versions body: the source's latest content, blocks cut to the fields push-be accepts. */
export const copyVersionBody = (revision: number, version: { content?: unknown; blocks?: CopyBlock[] }) => ({
  expectedRevision: revision,
  content: version.content,
  blocks: (version.blocks ?? []).map(({ id, text, evidenceRefs }) => ({ id, text, ...(evidenceRefs === undefined ? {} : { evidenceRefs }) })),
})
