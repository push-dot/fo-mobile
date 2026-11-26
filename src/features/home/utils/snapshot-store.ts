import { Directory, File, Paths } from 'expo-file-system'
import { HOME_SNAPSHOT_DIR, HOME_SNAPSHOT_MAX_AGE_MS, HOME_SNAPSHOT_VERSION } from '../constants'
import type { HomeSnapshot } from '../types'

const isFresh = (savedAt: number, now = Date.now()) => now - savedAt <= HOME_SNAPSHOT_MAX_AGE_MS

const snapshotDir = () => new Directory(Paths.document, HOME_SNAPSHOT_DIR)

const snapshotFile = (userId: string) => new File(snapshotDir(), `${userId}.json`)

export const parseHomeSnapshot = (raw: string | null, now = Date.now()): HomeSnapshot | null => {
  if (!raw) return null
  try {
    const parsed = JSON.parse(raw) as HomeSnapshot
    if (parsed.version !== HOME_SNAPSHOT_VERSION) return null
    if (!isFresh(parsed.savedAt, now)) return null
    if (!parsed.sections?.latest || !parsed.sections?.deadline || !parsed.sections?.popular) return null
    if (typeof parsed.unreadCount !== 'number') return null
    return parsed
  } catch {
    return null
  }
}

export const readHomeSnapshot = async (userId: string, now = Date.now()): Promise<HomeSnapshot | null> => {
  try {
    const file = snapshotFile(userId)
    if (!file.exists) return null
    return parseHomeSnapshot(await file.text(), now)
  } catch {
    return null
  }
}

export const writeHomeSnapshot = async (userId: string, snapshot: HomeSnapshot) => {
  try {
    snapshotDir().create({ intermediates: true, idempotent: true })
    await snapshotFile(userId).write(JSON.stringify(snapshot))
  } catch {
  }
}

export const clearHomeSnapshot = async (userId: string) => {
  try {
    const file = snapshotFile(userId)
    if (file.exists) file.delete()
  } catch {
  }
}
