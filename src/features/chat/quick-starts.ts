import type { Icon3DName } from '@/shared/components'
import type { QsItem } from './api/client'

export type QsLayout = 'link' | 'match' | 'pick' | 'deadline' | 'status' | 'calendar' | 'cards' | 'reply'

/** What the sheet collected; `start` turns it into the conversation title and first message. */
export type QsInput = { picked: QsItem[]; url: string; chips: string[]; option: boolean; doc?: string; task: string; custom: string }

export type QuickStart = {
  key: string
  label: string
  icon: Icon3DName
  title: string
  description: string
  layout: QsLayout
  /** Button label; omitted when tapping a row starts the conversation (제안 답장). */
  action?: string | ((n: number) => string)
  multi?: boolean
  grid?: boolean
  docLabel?: string
  custom?: string
  start: (i: QsInput) => { title: string; message: string } | null | undefined
}

const one = (i: QsInput) => i.picked[0]
const host = (url: string) => url.replace(/^https?:\/\//, '').split(/[/?#]/)[0] ?? url

// Order per feature-spec 15.1: what people do most first, social tasks last.
export const QUICK_STARTS: QuickStart[] = [
  {
    key: 'link', label: '공고 링크로 맞추기', icon: 'link', layout: 'link', action: '맞추기 시작', docLabel: '비교할 서류',
    title: '어떤 공고에 맞출까요?', description: '공고 링크를 붙여넣으면 내 서류를 그 공고에 맞춰 고쳐요.',
    start: (i) => (/^https?:\/\/\S+\.\S+/.test(i.url.trim()) ? { title: `${host(i.url)} 공고 맞춤`, message: `${i.url.trim()} 공고에 맞춰 ${i.doc}를 고쳐 주세요` } : null),
  },
  {
    key: 'match', label: '나에게 맞는 공고 찾기', icon: 'target', layout: 'match', action: '공고 찾기',
    title: '이 조건으로 찾아볼까요?', description: '내 프로필과 서류에서 가져온 조건이에요. 바꿔도 돼요.',
    start: (i) => ({ title: '나에게 맞는 공고', message: `${i.chips.join(' · ')} 조건으로 공고를 찾아 주세요${i.option ? '. 적합도 7점 이상인 공고만 보여 주세요' : ''}` }),
  },
  {
    key: 'gap', label: '부족한 점 찾기', icon: 'glass', layout: 'pick', action: '부족한 점 찾기', docLabel: '비교할 서류',
    title: '어떤 공고와 비교할까요?', description: '공고 요건과 내 서류를 비교해 부족한 점을 찾아요.',
    start: (i) => one(i) && { title: `${one(i)!.over} 공고 갭 분석`, message: `${one(i)!.over} ${one(i)!.title} 공고와 ${i.doc}를 비교해서 부족한 점을 찾아 주세요` },
  },
  {
    key: 'fit', label: '적합도 보기', icon: 'chart', layout: 'pick', action: '적합도 보기', docLabel: '비교할 서류',
    title: '어떤 공고로 볼까요?', description: '서류는 고치지 않고 적합도 점수만 보여 드려요.',
    start: (i) => one(i) && { title: `${one(i)!.over} 적합도`, message: `${one(i)!.over} ${one(i)!.title} 공고 기준으로 ${i.doc} 적합도 점수만 보여 주세요` },
  },
  {
    key: 'deadline', label: '마감 임박 공고 정리', icon: 'bookmark', layout: 'deadline', action: '준비할 일 정리하기',
    title: '마감 임박 공고', description: '북마크한 공고 중 일주일 안에 마감돼요. 준비할 일을 정리해 드려요.',
    start: (i) => ({ title: '마감 임박 공고 정리', message: `마감 임박 공고 ${i.picked.length}개(${i.picked.map((p) => p.over).join(', ')})의 준비할 일을 정리해 주세요` }),
  },
  {
    key: 'status', label: '지원 현황 정리', icon: 'paper', layout: 'status', multi: true, action: (n) => `${n}개 정리하기`,
    title: '어떤 지원을 정리할까요?', description: '단계별로 지금 상황과 다음에 할 일을 정리해요.',
    start: (i) => (i.picked.length ? { title: '지원 현황 정리', message: `${i.picked.map((p) => p.over).join(', ')} 지원 현황을 정리하고 다음에 할 일을 알려 주세요` } : null),
  },
  {
    key: 'calendar', label: '캘린더 관리', icon: 'cal', layout: 'calendar', action: (n) => CALENDAR_TASKS[n]!.label,
    title: '캘린더로 무엇을 할까요?', description: '지원·면접·마감·커피챗 일정을 한 캘린더에서 정리해요.',
    start: (i) => ({ title: '이번 주 일정 정리', message: `${i.task}: 이번 주 일정 ${i.picked.length}건을 정리해 주세요` }),
  },
  {
    key: 'hub', label: '허브 프로필 다듬기', icon: 'person', layout: 'cards', multi: true, grid: true, action: '다듬기 시작', docLabel: '바탕이 될 서류',
    title: '어떤 부분을 다듬을까요?', description: '내 서류를 바탕으로 허브 프로필을 고쳐요. 바꾸기 전에 보여 드려요.',
    start: (i) => (i.picked.length ? { title: '허브 프로필 다듬기', message: `${i.doc}를 바탕으로 허브 프로필의 ${i.picked.map((p) => p.title).join(', ')}을 다듬어 주세요` } : null),
  },
  {
    key: 'exp', label: '경험 만들기', icon: 'star', layout: 'cards', action: '프로젝트 기획 시작', custom: '직접 입력하기',
    title: '어떤 경험을 만들까요?', description: '최근 갭 분석에서 부족했던 경험이에요. 작은 프로젝트로 근거를 만들어요.',
    start: (i) => {
      const topic = i.custom.trim() || one(i)?.title
      return topic ? { title: `${topic} 프로젝트`, message: `${topic}을 보여 줄 작은 프로젝트를 기획해 주세요` } : null
    },
  },
  {
    key: 'reply', label: '제안 답장 쓰기', icon: 'mail', layout: 'reply',
    title: '어떤 제안에 답장할까요?', description: '제안 내용과 내 프로필을 읽고 답장 초안을 써요.',
    start: (i) => one(i) && { title: `${one(i)!.title} 님 제안 답장`, message: `${one(i)!.title} 님의 제안 “${one(i)!.body}”에 보낼 답장 초안을 써 주세요` },
  },
  {
    key: 'coffee', label: '커피챗 제안 쓰기', icon: 'coffee', layout: 'pick', action: '제안 글 쓰기',
    title: '누구에게 제안할까요?', description: '상대 프로필과 내 경력을 읽고 제안 글을 써요.',
    start: (i) => one(i) && { title: `${one(i)!.title} 님께 커피챗`, message: `${one(i)!.title} 님에게 보낼 커피챗 제안 글을 써 주세요` },
  },
  {
    key: 'post', label: '커리어 글 쓰기', icon: 'bubble', layout: 'cards', action: '초안 쓰기', custom: '직접 주제 정하기',
    title: '어떤 이야기를 쓸까요?', description: '내 활동에서 쓸 만한 주제를 골라 봤어요.',
    start: (i) => {
      const topic = i.custom.trim() || one(i)?.title
      return topic ? { title: topic, message: `“${topic}” 커리어 글 초안을 써 주세요` } : null
    },
  },
]

export const CALENDAR_TASKS = [
  { label: '이번 주 정리하기', sub: '일정마다 준비할 일까지', icon: 'check' },
  { label: '마감일 넣기', sub: '북마크·지원한 공고 마감일', icon: 'clock' },
  { label: '면접·커피챗 잡기', sub: '시간 골라 일정 등록', icon: 'people' },
  { label: '준비 알림 만들기', sub: '면접 전날, 마감 3일 전', icon: 'bell' },
] as const
