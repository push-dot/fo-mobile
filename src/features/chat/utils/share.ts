import { ApiError } from '@push/api-client'
import { FILE_SHARE_FAILED, FILE_SHARE_NOT_FINALIZED } from '../constants'

export const exclusive = () => {
  let busy = false
  return async (job: () => Promise<void>) => {
    if (busy) return
    busy = true
    try {
      await job()
    } finally {
      busy = false
    }
  }
}

export const pdfName = (name: string) => `${name.replace(/\.(pdf|docx?|hwpx?|txt|md)$/i, '')}.pdf`

export const shareErrorText = (error: unknown) =>
  error instanceof ApiError && error.code === 'DOCUMENT_NOT_FINALIZED' ? FILE_SHARE_NOT_FINALIZED : FILE_SHARE_FAILED
