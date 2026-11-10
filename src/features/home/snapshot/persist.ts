import type { QueryClient } from '@tanstack/react-query'
import { HOME_SNAPSHOT_VERSION } from './constants'
import { collectHomeSnapshotPayload } from './hydrate'
import { writeHomeSnapshot } from './store'

export type SnapshotPersistGate = {
  bumpGeneration: () => void
  currentGeneration: () => number
  currentUserId: () => string | null | undefined
}

export const createSnapshotPersistGate = (currentUserId: () => string | null | undefined): SnapshotPersistGate => {
  let generation = 0
  return {
    bumpGeneration: () => {
      generation += 1
    },
    currentGeneration: () => generation,
    currentUserId,
  }
}

export const persistHomeSnapshotIfCurrent = async (
  qc: QueryClient,
  userId: string,
  generation: number,
  gate: SnapshotPersistGate,
) => {
  if (generation !== gate.currentGeneration()) return
  if (gate.currentUserId() !== userId) return
  const payload = collectHomeSnapshotPayload(qc)
  if (!payload) return
  await writeHomeSnapshot(userId, { version: HOME_SNAPSHOT_VERSION, ...payload })
}
