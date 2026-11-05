import type { HubProfile } from '../types'

type DocNode = { type?: unknown; text?: unknown; content?: unknown }
type Section = 'headline' | 'intro' | 'careers' | 'skills' | 'skip'

const DATE = /^\d{4}-\d{2}-\d{2}$/

const nodeText = (node: DocNode): string =>
  (typeof node.text === 'string' ? node.text : '') +
  (Array.isArray(node.content) ? node.content.map((child) => nodeText(child as DocNode)).join('') : '')

const docLines = (content: unknown) => {
  const lines: { heading: boolean; text: string }[] = []
  const visit = (node: unknown): void => {
    if (!node || typeof node !== 'object') return
    if (Array.isArray(node)) return node.forEach(visit)
    const typed = node as DocNode
    if (typed.type === 'heading' || typed.type === 'paragraph' || typed.type === 'listItem') {
      lines.push({ heading: typed.type === 'heading', text: nodeText(typed).trim() })
      return
    }
    visit(typed.content)
  }
  visit(content)
  return lines
}

const sectionOf = (label: string): Section => {
  const key = label.trim().replace(/[:：]\s*$/, '').toLowerCase()
  if (key === '소개' || key === 'intro') return 'intro'
  if (key === '경력' || key === 'careers' || key === 'career') return 'careers'
  if (key === '기술' || key === '기술 스택' || key === 'skills' || key === 'skill') return 'skills'
  if (key === '한 줄' || key === '헤드라인' || key === 'headline') return 'headline'
  return 'skip'
}

const careerOf = (line: string) => {
  const [company = '', role = '', start = '', end = '', description = ''] = line.split('|').map((part) => part.trim())
  if (!company || !role) return { company: line.trim(), role: line.trim(), startedOn: null, endedOn: null, description: '' }
  return {
    company,
    role,
    startedOn: DATE.test(start) ? start : null,
    endedOn: DATE.test(end) ? end : null,
    description,
  }
}

export const hubProfile = (content: unknown): HubProfile => {
  const buckets: Record<Exclude<Section, 'skip'>, string[]> = { headline: [], intro: [], careers: [], skills: [] }
  let current: Section = 'intro'
  for (const line of docLines(content)) {
    if (line.heading) {
      current = sectionOf(line.text)
      continue
    }
    const text = line.text.replace(/^•\s*/, '').trim()
    if (text && current !== 'skip') buckets[current].push(text)
  }
  return {
    headline: buckets.headline.join('\n'),
    intro: buckets.intro.join('\n'),
    careers: buckets.careers.map(careerOf),
    skills: buckets.skills.flatMap((line) => line.split(/[,·、]/)).map((skill) => skill.trim()).filter(Boolean),
  }
}
