import type { Posting } from '@push/api-client'

const BRAND = ['#1F3A8A', '#0E7A5F', '#7A2E8C', '#B4501E', '#1B6E8F', '#5B4CF0', '#8C2F39']

export const brandOf = (company: string) => BRAND[[...company].reduce((a, ch) => a + ch.charCodeAt(0), 0) % BRAND.length]!

export const careerLabel = (p: Pick<Posting, 'careerMin' | 'careerMax'>) =>
  p.careerMin === 0 && !p.careerMax ? '신입' : p.careerMax ? `${p.careerMin}–${p.careerMax}년` : `${p.careerMin}년+`
