import type { ListEnvelope, SourceItem } from '@push/api-client'
import { api } from './api-client'

export type PickedFile = { uri: string; name: string; mimeType?: string | null; size?: number | null }

export type MySource = SourceItem & { jobId?: string; status?: string }

const uploaded = new Map<string, string | undefined>()

export const sourcesApi = {
  list: async (): Promise<ListEnvelope<MySource>> => {
    const r = await api.sources.list({ kind: 'UPLOAD', limit: 100 })
    return {
      ...r,
      data: r.data.map((s) => {
        const raw = s as MySource
        return { ...raw, jobId: uploaded.get(s.id) ?? raw.jobId }
      }),
    }
  },
  upload: async (file: PickedFile) => {
    const form = new FormData()
    form.append('kind', 'RESUME')
    form.append('file', { uri: file.uri, name: file.name, type: file.mimeType ?? 'application/pdf', size: file.size ?? 0 } as unknown as Blob)
    const s = await api.sources.upload(form)
    uploaded.set(s.id, s.jobId)
    return s
  },
  remove: async (id: string) => {
    await api.sources.remove(id)
    uploaded.delete(id)
  },
}
