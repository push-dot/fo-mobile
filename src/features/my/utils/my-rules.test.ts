import { readFileSync } from 'node:fs'
import { join } from 'node:path'
import { describe, expect, it } from 'vitest'
import { LANGS, MAX_BYTES } from '../constants'
import {
  AGENT_NOTE,
  AGENT_TITLE,
  CALENDAR_ADD,
  INTERVIEW_PREP,
  NOTIFICATION_ROWS,
  OFFER_DECLINE,
  OFFER_EMPTY_ACTION,
  OFFER_FAIL,
  OFFER_FAIL_LINE,
  PREVIEW_HEADINGS,
  REFERENCE_LABEL,
  REFERENCE_SUB,
  SIZE_LIMIT,
  THEME_CHOICES,
  WITHDRAW_BODY,
  careerDeleteBody,
  careerDeleteCopy,
  commentedSee,
  deleteDocCopy,
  emptyCta,
  followMatches,
  followSeeAll,
  followerSee,
  hideCompanyLabel,
  postsSeeAll,
  profileCountLabels,
  pushCardLines,
  profileConvertBody,
  pushSeeAll,
  SET_BASE_COPY,
  setBaseProfilePath,
  showViewCount,
  skillOrderHint,
  stageFlow,
  themeMode,
} from './my-rules'

describe('my screen rules', () => {
  it('shows following, follower, and post counts', () => {
    expect(profileCountLabels({ followingCount: 18, followerCount: 12, postCount: 8 })).toEqual({
      following: { count: 18, label: '팔로잉' },
      followers: { count: 12, label: '팔로워' },
      posts: { count: 8, label: '게시글' },
    })
    expect(profileCountLabels({})).toEqual({
      following: { count: 0, label: '팔로잉' },
      followers: { count: 0, label: '팔로워' },
      posts: { count: 0, label: '게시글' },
    })
  })

  it('tells the skill order as a long-press that moves the skill forward', () => {
    expect(skillOrderHint).toBe('길게 누르면 앞으로 옮겨요. 앞의 5개가 허브 목록에 보여요.')
  })

  it('keeps the application record when a file is deleted, and uses 삭제', () => {
    expect(deleteDocCopy('경력기술서.pdf')).toEqual({
      title: '이 서류를 삭제할까요?',
      body: '경력기술서.pdf를 서류에서 지워요. 이 서류로 지원한 기록은 남아요.',
      confirm: '삭제',
      cancel: '취소',
      toast: '서류를 삭제했어요',
      undo: '되돌리기',
      failed: '서류를 삭제하지 못했어요',
    })
    expect(deleteDocCopy('포트폴리오집').body.startsWith('포트폴리오집을 ')).toBe(true)
  })

  it('confirms a career delete and offers undo', () => {
    expect(careerDeleteCopy).toEqual({
      title: '이 경력을 삭제할까요?',
      confirm: '삭제',
      toast: '경력을 삭제했어요',
      undo: '되돌리기',
    })
    expect(careerDeleteBody({ company: '모아페이', role: '백엔드 엔지니어' })).toBe(
      '모아페이 · 백엔드 엔지니어 경력을 프로필에서 지워요.',
    )
    expect(careerDeleteBody({ company: ' 모아페이 ', role: '' })).toBe('모아페이 경력을 프로필에서 지워요.')
    expect(careerDeleteBody({ company: '', role: '' })).toBe('이 경력을 프로필에서 지워요.')
  })

  it('keeps the known size-limit sentences', () => {
    const mb = MAX_BYTES / (1024 * 1024)
    expect(SIZE_LIMIT).toEqual({
      title: `${mb}MB까지 올릴 수 있어요`,
      body: '크기를 줄여서 다시 올려 주세요.',
      footnote: 'PDF, DOCX 파일을 20MB까지 올릴 수 있어요.',
    })
    expect(mb).toBe(20)
  })

  it('converts a document to an application profile and sends no target', () => {
    expect(profileConvertBody()).toEqual({})
    expect(Object.keys(profileConvertBody())).not.toContain('target')
  })

  it('asks before setting the application profile as the base profile', () => {
    expect(SET_BASE_COPY).toEqual({
      action: '기본 프로필로 설정',
      title: '이 프로필을 기본 프로필로 설정할까요?',
      body: '허브에 보이는 내 프로필이 이 내용으로 바뀌어요.',
      confirm: '설정',
      cancel: '취소',
      toast: '기본 프로필로 설정했어요.',
    })
    expect(setBaseProfilePath('doc-1')).toBe('documents/doc-1/base-profile')
  })

  it('names the follow and post see-all rows', () => {
    expect(followSeeAll(18)).toBe('18명 전체 보기 ›')
    expect(followerSee(12)).toBe('팔로워 12명 보기 ›')
    expect(postsSeeAll(8)).toBe('8개 전체 보기 ›')
    expect(commentedSee(9)).toBe('댓글 단 글 9개 보기 ›')
    expect(pushSeeAll(5)).toBe('전체 5개 보기')
  })

  it('filters following by name or job', () => {
    const people = [
      { displayName: '이수빈', headline: '백엔드 개발자' },
      { displayName: '김서준', headline: '프로덕트 디자이너' },
    ]
    expect(followMatches(people, '')).toEqual(people)
    expect(followMatches(people, '백엔드').map((p) => p.displayName)).toEqual(['이수빈'])
    expect(followMatches(people, '서준').map((p) => p.displayName)).toEqual(['김서준'])
    expect(followMatches(people, '없는사람')).toEqual([])
  })

  it('gives each empty activity list one action', () => {
    expect(emptyCta('applications')).toEqual({
      title: '아직 지원한 공고가 없어요.',
      action: '채용공고 보기',
      href: '/jobs',
    })
    expect(emptyCta('bookmarks')).toEqual({
      title: '북마크한 공고가 없어요.',
      action: '채용공고 보기',
      href: '/jobs',
    })
    expect(emptyCta('follows')).toEqual({
      title: '아직 팔로우한 사람이 없어요.',
      action: '허브 둘러보기',
      href: '/hub',
    })
    expect(emptyCta('posts')).toEqual({
      title: '아직 쓴 글이 없어요.',
      action: '글쓰기',
      href: '/compose',
    })
  })

  it('shows view counts on my posts and detail, not the feed', () => {
    expect(showViewCount('feed')).toBe(false)
    expect(showViewCount('detail')).toBe(true)
    expect(showViewCount('my-posts')).toBe(true)
    expect(showViewCount('my-all')).toBe(true)
  })

  it('maps an application stage onto the four-step flow', () => {
    expect(stageFlow('APPLIED')).toEqual({ step: 0, headline: '지원함', labels: ['지원', '서류 통과', '면접', '결과'] })
    expect(stageFlow('SCREENING').step).toBe(1)
    expect(stageFlow('SCREENING').headline).toBe('서류 통과')
    expect(stageFlow('INTERVIEW')).toMatchObject({ step: 2, headline: '면접 진행 중' })
    expect(stageFlow('OFFER')).toMatchObject({ step: 3, headline: '합격' })
    expect(stageFlow('ACCEPTED').headline).toBe('합격')
    expect(stageFlow('REJECTED').headline).toBe('불합격')
    expect(stageFlow('WITHDRAWN').headline).toBe('불합격')
    expect(stageFlow('PREPARING').step).toBe(0)
  })

  it('locks the activity, offer, and calendar labels', () => {
    expect(INTERVIEW_PREP).toBe('Push 에이전트로 면접 준비')
    expect(CALENDAR_ADD).toBe('일정 추가하기')
    expect(OFFER_DECLINE).toBe('거절')
    expect(OFFER_FAIL).toBe('잠시 뒤에 다시 보내 주세요.')
    expect(OFFER_FAIL_LINE).toBe('메시지를 보내지 못했어요. 잠시 뒤에 다시 보내 주세요.')
    expect(OFFER_EMPTY_ACTION).toBe('허브 프로필 다듬기')
  })

  it('lists five notification rows, the agent group, and the reference row', () => {
    expect(NOTIFICATION_ROWS.map((row) => row.key)).toEqual([
      'notifyDeadline',
      'notifyOffer',
      'notifyComment',
      'notifyAiDone',
      'notifyApplicationStage',
    ])
    expect(NOTIFICATION_ROWS.map((row) => row.label)).toEqual([
      '마감 임박 공고',
      '제안 받음',
      '댓글과 답글',
      '에이전트 작업 완료',
      '지원 상태 변경',
    ])
    expect(AGENT_TITLE).toBe('에이전트')
    expect(AGENT_NOTE).toBe('마이 › 서류와 북마크 공고를 에이전트가 읽어서 이력서를 고쳐요.')
    expect(REFERENCE_LABEL).toBe('참고 데이터 제공')
    expect(REFERENCE_SUB).toBe('에이전트를 쓰려면 켜 두어야 해요')
  })

  it('stores light, dark, or system and resolves system from the device', () => {
    expect(THEME_CHOICES).toEqual([
      { key: 'light', label: '라이트' },
      { key: 'dark', label: '다크' },
      { key: 'system', label: '시스템' },
    ])
    expect(themeMode('light', 'dark')).toBe('light')
    expect(themeMode('dark', 'light')).toBe('dark')
    expect(themeMode('system', 'dark')).toBe('dark')
    expect(themeMode('system', null)).toBe('light')
  })

  it('offers Korean and English only', () => {
    expect(LANGS.map((l) => l.key)).toEqual(['ko', 'en'])
  })

  it('names the company on the hide row', () => {
    expect(hideCompanyLabel('모아페이')).toBe('모아페이 사람에게 숨기기')
    expect(hideCompanyLabel('')).toBe('지금 다니는 회사 사람에게 숨기기')
  })

  it('says withdrawal does not cancel the store subscription', () => {
    expect(WITHDRAW_BODY).toBe(
      '구독은 탈퇴해도 자동으로 해지되지 않아요. App Store나 Google Play에서 직접 해지해 주세요. 30일 안에 다시 로그인하면 계정이 복구되고, 30일이 지나면 이력서·서류·글·댓글이 모두 삭제돼요. 삭제된 뒤에는 되돌릴 수 없어요.',
    )
  })

  it('keeps a project heading on the preview', () => {
    expect(PREVIEW_HEADINGS).toEqual(['경력', '프로젝트', '기술 스택'])
  })

  it('joins a push document to its posting', () => {
    expect(
      pushCardLines(
        { title: '허브 프로필' },
        { company: '모아페이', title: '백엔드 엔지니어', fitScore: 86 },
      ),
    ).toEqual({ title: '백엔드 엔지니어', company: '모아페이', score: '8.6', doc: '허브 프로필' })
    expect(pushCardLines({ title: '허브 프로필' }, null)).toEqual({
      title: '허브 프로필',
      company: '',
      score: '',
      doc: '',
    })
  })
})

describe('settings screen', () => {
  // push-be never reads allowAiReadMyFiles, so the switch would be a dead control (D19).
  it('hides the 내 자료 읽기 허용 switch until the server enforces it', () => {
    const screen = readFileSync(join(__dirname, '../../../screens/my/settings-screen.tsx'), 'utf8')
    expect(screen).not.toContain('allowAiReadMyFiles')
    expect(screen).not.toContain('내 자료 읽기 허용')
  })
})
