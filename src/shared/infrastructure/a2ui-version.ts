import type { A2uiVersion } from '@push/api-client'

export const A2UI_VERSION: A2uiVersion = process.env.EXPO_OS === 'ios' ? '1.0' : 'v0.9.1'
