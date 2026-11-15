import { describe, expect, it } from 'vitest'
import { postingSentLine } from './posting-sent'

describe('postingSentLine', () => {
  it('picks 을 after a final consonant and 를 after a vowel', () => {
    expect(postingSentLine('오지현', '결제 플랫폼 시니어 엔지니어')).toBe('오지현 님이 결제 플랫폼 시니어 엔지니어를 보냈어요')
    expect(postingSentLine('오지현', '백엔드 개발자 (Java)')).toBe('오지현 님이 백엔드 개발자 (Java)를 보냈어요')
    expect(postingSentLine('한지민', '정산팀 채용')).toBe('한지민 님이 정산팀 채용을 보냈어요')
  })
})
