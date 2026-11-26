import type { ApplicationStage } from '@push/api-client'

export const stageSolid = (stage: ApplicationStage) => stage === 'OFFER' || stage === 'ACCEPTED'
