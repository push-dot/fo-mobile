import { botApi } from '@/shared/infrastructure'
import type { MaterialKind, MaterialTab } from '../types'
import { toMaterialDetail, toMaterialsPage } from './schemas'

/** `next` pages the one section of a single tab. 전체 is a preview and has none. */
export const fetchMaterials = async (tab: MaterialTab, q: string, cursor?: string) => {
  const page = await botApi.materials.list({ tab, q: q || undefined, cursor })
  return { page: toMaterialsPage(page), next: tab === 'all' ? null : (page.sections[0]?.nextCursor ?? null) }
}

export const fetchMaterial = async (kind: MaterialKind, id: string) => toMaterialDetail(await botApi.materials.get(kind, id))

/** The server applies the kind's rule: delete a file, archive a document, drop a bookmark, remove a link. */
export const deleteMaterial = (kind: MaterialKind, id: string) => botApi.materials.remove(kind, id)
