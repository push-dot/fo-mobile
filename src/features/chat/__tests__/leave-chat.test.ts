import { beforeEach, describe, expect, it, vi } from 'vitest'
import { leaveChat } from '../utils/leave-chat'

const router = vi.hoisted(() => ({ canGoBack: vi.fn(), back: vi.fn(), replace: vi.fn() }))
vi.mock('expo-router', () => ({ router }))

describe('leaveChat', () => {
  beforeEach(() => vi.clearAllMocks())

  it('goes back when the stack has a previous screen', () => {
    router.canGoBack.mockReturnValue(true)
    leaveChat()
    expect(router.back).toHaveBeenCalledOnce()
    expect(router.replace).not.toHaveBeenCalled()
  })

  it('lands on home when the chat is the only screen', () => {
    router.canGoBack.mockReturnValue(false)
    leaveChat()
    expect(router.back).not.toHaveBeenCalled()
    expect(router.replace).toHaveBeenCalledWith('/(app)/(stack)/(tabs)/(home)')
  })
})
