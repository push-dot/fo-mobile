import { describe, expect, it } from 'vitest'
import { postingSentLine } from './posting-sent'

describe('postingSentLine', () => {
  it('names the sender and not the posting, which sits in the card under it (ProposalChat)', () => {
    expect(postingSentLine('오지현')).toBe('오지현 님이 공고를 보냈어요')
  })
})
