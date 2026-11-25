import type { AccessMode } from '@push/api-client'
import type { MenuSection } from '@/shared/components/menu-action'
import { ACCESS_MODES, ACCESS_TITLE, DEFAULT_ACCESS_MODE } from '../constants'

export const accessLabel = (current: AccessMode | null | undefined) =>
  ACCESS_MODES.find((m) => m.key === (current ?? DEFAULT_ACCESS_MODE))!.label

export const accessMenu = (current: AccessMode | null | undefined, onPick: (mode: AccessMode) => void): MenuSection[] => [
  {
    key: 'access',
    title: ACCESS_TITLE,
    actions: ACCESS_MODES.map((m) => ({ key: m.key, label: m.label, selected: m.key === (current ?? DEFAULT_ACCESS_MODE), onPress: () => onPick(m.key) })),
  },
]
