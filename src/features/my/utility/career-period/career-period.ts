import type { Career } from '@push/api-client'
import { ymLabel } from '../ym-label'

export const careerPeriod = (c: Pick<Career, 'startedOn' | 'endedOn'>) =>
  `${ymLabel(c.startedOn)} – ${c.endedOn ? ymLabel(c.endedOn) : '현재'}`
