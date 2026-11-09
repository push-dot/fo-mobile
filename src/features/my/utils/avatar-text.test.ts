import { describe, expect, it } from 'vitest'
import { avatarTextSize } from './avatar-text'

describe('avatarTextSize', () => {
  it('uses the boards’ initials size for each avatar size the app draws', () => {
    // ProposalChat 36/13, SettingsBlocked 44/14, MyFollowingAll 48/15, ProposalDetail 56/18, EditProfile 64/20, MyProfile 84/26
    expect([36, 44, 48, 56, 64, 84].map(avatarTextSize)).toEqual([13, 14, 15, 18, 20, 26])
  })
})
