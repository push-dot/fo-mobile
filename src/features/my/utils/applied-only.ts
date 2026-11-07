import type { Application } from '@push/api-client'

const NOT_SENT = new Set<Application['stage']>(['DISCOVERED', 'PREPARING', 'READY'])

export const appliedOnly = (list: Application[]) => list.filter((a) => a.appliedAt != null || !NOT_SENT.has(a.stage))
