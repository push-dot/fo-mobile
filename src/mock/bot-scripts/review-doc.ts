type StreamHunk = { line: number; sign: '' | '+' | '-'; text: string }

const keep = (text: string): Omit<StreamHunk, 'line'> => ({ sign: '', text })
const drop = (text: string): Omit<StreamHunk, 'line'> => ({ sign: '-', text })
const add = (text: string): Omit<StreamHunk, 'line'> => ({ sign: '+', text })

/**
 * The Push 프로필 of ChatApprove as the hunks the app reads: every line of the document, the changed ones marked.
 * The live edit_document tool sends the same shape: every line of the document version, the changed ones marked (push-be personal/tools.py `_page_hunks`).
 */
export const PROFILE_REVIEW_HUNKS: StreamHunk[] = [
  keep('# 김서준'),
  keep('결제 시스템을 만드는 백엔드 개발자 · 4년차'),
  keep('## 소개'),
  keep('4년 동안 결제·정산 시스템을 설계하고 운영했어요.'),
  drop('트래픽이 몰리는 기간에도 장애 없는 결제를 만드는 데 집중해 왔어요.'),
  add('피크 트래픽에서도 결제 승인 성공률 99.98%를 지켰어요.'),
  keep('## 경력'),
  keep('모아페이 · 백엔드 엔지니어 · 2022.03 – 현재'),
  drop('결제 승인 API와 정산 배치를 맡고 있어요.'),
  add('결제 승인 API 재설계, p95 320ms → 140ms'),
  add('정산 배치 장애 대응, 실패율 2.1% → 0.3%'),
  keep('Kafka 기반 결제 이벤트 파이프라인 구축'),
  keep('하루랩스 · 서버 개발자 · 2020.07 – 2022.02'),
  keep('주문·쿠폰 API 개발과 운영'),
  keep('## 기술 스택'),
  drop('Java · Spring Boot · MySQL · Kafka'),
  add('Kafka · Kotlin · Spring Boot · MySQL'),
  keep('## 프로젝트'),
  add('payment-retry-lab · 결제 재시도 큐'),
  keep('## 활동'),
  drop('사내 개발 동아리 운영, 월간 세미나 12회 진행'),
  add('사내 개발 동아리 운영'),
].map((h, i) => ({ line: i + 1, ...h }))

export const PROFILE_REVIEW_COUNTS = { added: 6, removed: 4 }
