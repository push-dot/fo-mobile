import { absoluteUrl } from '@push/api-client'
import { API_BASE_URL } from '../../infrastructure/config'

export const assetUrl = (url: string | null | undefined) => absoluteUrl(url, API_BASE_URL) ?? undefined
