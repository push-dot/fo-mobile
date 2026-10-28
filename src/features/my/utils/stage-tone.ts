import type { ApplicationStage } from '@push/api-client'
import type { BadgeTone } from '@/shared/components'

export const stageTone = (stage: ApplicationStage): BadgeTone => {
  switch (stage) {
    case 'SCREENING':
      return 'ac'
    case 'INTERVIEW':
      return 'orange'
    case 'OFFER':
    case 'ACCEPTED':
      return 'green'
    case 'REJECTED':
    case 'WITHDRAWN':
      return 'red'
    default:
      return 'grey'
  }
}
