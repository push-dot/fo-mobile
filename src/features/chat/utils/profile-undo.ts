import type { Profile } from '@push/api-client'

type Patch = Partial<Profile>

/** The profile fields a Bot run can change (update_my_profile); the rest of a profile is the server's. */
const EDITABLE = ['headline', 'jobCategory', 'tenureYears', 'careerStatus', 'openToOffers', 'intro', 'careers', 'skills'] as const

/** The old values of the fields a run changed: sending them back puts the profile as it was (rule 39: applied at once, undone from the chat). */
export const restorePatch = (before: Profile, after: Profile): Patch => {
  const patch: Record<string, unknown> = {}
  for (const key of EDITABLE) if (JSON.stringify(before[key]) !== JSON.stringify(after[key])) patch[key] = before[key]
  return patch as Patch
}

const held = new Map<string, Profile>()
const undo = new Map<string, Patch>()

/** The profile as it was when the run started saving, kept once per bot until the run's tool line closes. */
export const holdProfile = (botId: string, profile: Profile | undefined) => {
  if (profile && !held.has(botId)) held.set(botId, profile)
}

export const takeHeld = (botId: string) => {
  const profile = held.get(botId)
  held.delete(botId)
  return profile
}

export const keepUndo = (itemId: string, patch: Patch) => void undo.set(itemId, patch)

export const undoOf = (itemId: string) => undo.get(itemId)
