import type { LinkKind } from '@push/api-client'

export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  job: '공고',
  github: 'GitHub',
  portfolio: '포트폴리오',
  blog: '블로그',
  other: '기타',
}

export const kindOf = (url: string): LinkKind =>
  /github\.com/.test(url)
    ? 'github'
    : /velog|tistory|medium|brunch|blog/.test(url)
      ? 'blog'
      : /notion|portfolio|behance/.test(url)
        ? 'portfolio'
        : /career|jobs|recruit|wanted|saramin|jobkorea|greeting/.test(url)
          ? 'job'
          : 'other'

const GITHUB_OWNER_REPO = /^[\w-]+\/[\w.-]+$/

export const fullLinkUrl = (typed: string, picked: LinkKind | null) => {
  const url = typed.trim()
  if (picked === 'github' && GITHUB_OWNER_REPO.test(url)) return `https://github.com/${url}`
  return /^https?:\/\//.test(url) ? url : `https://${url}`
}
