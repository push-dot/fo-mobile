import { api } from '@/shared/infrastructure'
import type { CreateBotInput, UpdateBotInput } from '@push/api-client'

export const fetchBots = () => api.bots.list()
export const fetchBot = (id: string) => api.bots.get(id)
export const createBot = (body: CreateBotInput) => api.bots.create(body)
export const updateBot = (id: string, body: UpdateBotInput) => api.bots.update(id, body)
export const deleteBot = (id: string) => api.bots.remove(id)
export const fetchBotConversations = (id: string, limit: number, cursor?: string) =>
  api.bots.conversations(id, { limit, cursor })
export const createBotConversation = (id: string, title: string, applicationId?: string) =>
  api.bots.createConversation(id, { title, applicationId })
export const markBotRead = (id: string) => api.bots.markRead(id)
export const fetchLinkPreview = (url: string) => api.bots.linkPreview(url)
export const searchBotCompanies = (q: string, limit: number, cursor?: string) =>
  api.bots.searchCompanies(q, { limit, cursor })
export const fetchBotLibrary = (id: string, query?: Parameters<typeof api.bots.library>[1]) => api.bots.library(id, query)
