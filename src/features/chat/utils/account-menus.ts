import type { AccessMode, Tone } from '@push/api-client'
import { TONES } from '@/features/my'
import type { MenuAction } from '@/shared/components'
import { ACCESS_MODES } from '../constants'

/** 계정 › 말투: inline menu, the saved tone checked (그대로 when none is saved). */
export const toneMenu = (current: Tone | undefined, onPick: (tone: Tone) => void): MenuAction[] =>
  TONES.map((t) => ({ key: t.key, label: t.label, selected: t.key === (current ?? 'as_is'), onPress: () => onPick(t.key) }))

/** 계정 › 실행 방식: inline menu, the current mode checked. */
export const accessMenu = (current: AccessMode, onPick: (mode: AccessMode) => void): MenuAction[] =>
  ACCESS_MODES.map((m) => ({ key: m.key, label: m.label, selected: m.key === current, onPress: () => onPick(m.key) }))
