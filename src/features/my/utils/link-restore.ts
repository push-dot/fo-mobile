import { ApiError } from '@push/api-client'

export const restoreLinkFailure = (error: unknown): [title: string, body?: string] =>
  error instanceof ApiError && error.status === 404 ? ['이미 정리된 링크예요'] : ['되돌리지 못했어요', '잠시 뒤에 다시 해 주세요.']
