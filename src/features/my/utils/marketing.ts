export const MARKETING_COPY = {
  label: '혜택·이벤트 알림',
  sub: '새 기능, 이벤트, 할인 소식',
} as const

// 정보통신망법 §50⑦: tell the user who processed the change, when, and the result.
export const marketingResult = (on: boolean, iso: string | null, now = new Date()) => {
  const d = iso ? new Date(iso) : now
  const day = `${d.getFullYear()}년 ${d.getMonth() + 1}월 ${d.getDate()}일`
  return `${day}, Push 혜택·이벤트 알림을 ${on ? '받기로' : '받지 않기로'} 했어요`
}
