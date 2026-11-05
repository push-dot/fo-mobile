import type { LinkKind } from '@push/api-client'

export const LINK_KIND_LABEL: Record<LinkKind, string> = {
  job: '공고',
  github: 'GitHub',
  portfolio: '포트폴리오',
  blog: '블로그',
  other: '기타',
}

/** Guesses the link kind from its address (내 링크 추가). The server decides when `kind` is omitted. */
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
