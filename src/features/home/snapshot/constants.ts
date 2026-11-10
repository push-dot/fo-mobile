export const HOME_SNAPSHOT_VERSION = 2
/** Stale snapshots are discarded on read. */
export const HOME_SNAPSHOT_MAX_AGE_MS = 7 * 24 * 60 * 60 * 1000

export const homeSnapshotFileUri = (documentDirectory: string, userId: string) =>
  `${documentDirectory}home-snapshots/${encodeURIComponent(userId)}.json`
