import { botApi } from '@/shared/infrastructure'
import type { MaterialKind, MaterialsFilter } from '../types'
import { toMaterialDetail, toMaterialsPage } from './schemas'

export const fetchMaterials = async ({ tab, q, bot }: MaterialsFilter, cursor?: string) => {
  const page = await botApi.materials.list({ tab, q: q || undefined, bot, cursor })
  return { page: toMaterialsPage(page), next: tab === 'all' ? null : (page.sections[0]?.nextCursor ?? null) }
}

export const fetchMaterial = async (kind: MaterialKind, id: string) => toMaterialDetail(await botApi.materials.get(kind, id))

export const deleteMaterial = (kind: MaterialKind, id: string) => botApi.materials.remove(kind, id)

export const restoreMaterial = async (kind: MaterialKind, id: string) => void (await botApi.materials.restore(kind, id))
