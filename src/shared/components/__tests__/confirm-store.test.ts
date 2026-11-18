import { Alert } from 'react-native'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { askConfirm } from '../confirm-store'

vi.mock('react-native', () => ({ Alert: { alert: vi.fn() } }))

describe('askConfirm', () => {
  beforeEach(() => vi.clearAllMocks())

  it('opens the native alert with a cancel and a red confirm that runs onConfirm', () => {
    const onConfirm = vi.fn()
    askConfirm({ title: '이 서류를 삭제할까요?', body: '지워요', note: '되돌릴 수 없어요', confirm: '삭제', danger: true, onConfirm })
    const [title, message, buttons] = vi.mocked(Alert.alert).mock.calls[0]!
    expect(title).toBe('이 서류를 삭제할까요?')
    expect(message).toBe('지워요\n\n되돌릴 수 없어요')
    expect(buttons).toMatchObject([{ text: '취소', style: 'cancel' }, { text: '삭제', style: 'destructive' }])
    buttons![1]!.onPress!()
    expect(onConfirm).toHaveBeenCalledOnce()
  })

  it('keeps a plain confirm default-styled', () => {
    askConfirm({ title: '제목', body: '본문', confirm: '확인', cancel: '닫기', onConfirm: vi.fn() })
    expect(vi.mocked(Alert.alert).mock.calls[0]![2]).toMatchObject([{ text: '닫기', style: 'cancel' }, { text: '확인', style: 'default' }])
  })
})
