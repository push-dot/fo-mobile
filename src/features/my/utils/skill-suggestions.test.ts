import { describe, expect, it } from 'vitest'
import { SKILL_CATALOG } from '../constants'
import { skillSuggestions } from './skill-suggestions'

describe('skillSuggestions', () => {
  it('reads Redis, React, Rest Docs for "Re" as the EditSkills board does', () => {
    const own = ['Kotlin', 'Spring Boot', 'JPA', 'MySQL', 'Kafka', 'AWS']
    const catalog = SKILL_CATALOG.filter((s) => !own.includes(s))
    expect(skillSuggestions(catalog, 'Re').map((h) => h.item)).toEqual(['Redis', 'React', 'Rest Docs'])
  })

  it('keeps a prefix match ahead of a shorter contains match', () => {
    expect(skillSuggestions(['Go', 'Django', 'Gonzo'], 'go').map((h) => h.item)).toEqual(['Go', 'Gonzo', 'Django'])
  })
})
