import { describe, expect, it } from 'vitest'
import { splitBotText } from '../utils/bot-text'

describe('a bubble line with a link', () => {
  it('keeps the markdown link in the paragraph for Rich to draw', () => {
    expect(splitBotText('지원했어요. [이동하기](/my)')).toEqual([{ kind: 'paragraph', text: '지원했어요. [이동하기](/my)' }])
  })
})
