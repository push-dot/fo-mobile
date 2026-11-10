import * as FileSystem from 'expo-file-system/legacy'
import { HOME_SNAPSHOT_MAX_AGE_MS, HOME_SNAPSHOT_VERSION, homeSnapshotFileUri } from './constants'
import type { HomeSnapshot } from './types'

const isFresh = (savedAt: number, now = Date.now()) => now - savedAt <= HOME_SNAPSHOT_MAX_AGE_MS

const snapshotDir = (documentDirectory: string) => `${documentDirectory}home-snapshots/`

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

const ensureDir = async () => {
  const base = FileSystem.documentDirectory
  if (!base) return null
  const dir = snapshotDir(base)
  try {
    const info = await FileSystem.getInfoAsync(dir)
    if (!info.exists) await FileSystem.makeDirectoryAsync(dir, { intermediates: true })
    return base
  } catch {
    return null
  }
}

export const readHomeSnapshot = async (userId: string, now = Date.now()): Promise<HomeSnapshot | null> => {
  const base = FileSystem.documentDirectory
  if (!base) return null
  try {
    const uri = homeSnapshotFileUri(base, userId)
    const info = await FileSystem.getInfoAsync(uri)
    if (!info.exists) return null
    return parseHomeSnapshot(await FileSystem.readAsStringAsync(uri), now)
  } catch {
    return null
  }
}

export const writeHomeSnapshot = async (userId: string, snapshot: HomeSnapshot) => {
  try {
    const base = await ensureDir()
    if (!base) return
    await FileSystem.writeAsStringAsync(homeSnapshotFileUri(base, userId), JSON.stringify(snapshot))
  } catch {
    // Best-effort cache; never crash the app on full disk or permission errors.
  }
}

export const clearHomeSnapshot = async (userId: string) => {
  const base = FileSystem.documentDirectory
  if (!base) return
  try {
    const uri = homeSnapshotFileUri(base, userId)
    const info = await FileSystem.getInfoAsync(uri)
    if (info.exists) await FileSystem.deleteAsync(uri, { idempotent: true })
  } catch {
    // ignore
  }
}
