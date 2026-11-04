export const GOOGLE = `<svg viewBox="0 0 24 24"><path d="M21.6 12.2c0-.7-.1-1.4-.2-2H12v3.8h5.4a4.6 4.6 0 0 1-2 3v2.5h3.2c1.9-1.7 3-4.3 3-7.3Z" fill="#4285F4"/><path d="M12 22c2.7 0 5-.9 6.6-2.4l-3.2-2.5c-.9.6-2 1-3.4 1-2.6 0-4.8-1.8-5.6-4.1H3.1v2.6A10 10 0 0 0 12 22Z" fill="#34A853"/><path d="M6.4 14c-.2-.6-.3-1.3-.3-2s.1-1.4.3-2V7.4H3.1a10 10 0 0 0 0 9.2Z" fill="#FBBC05"/><path d="M12 5.9c1.5 0 2.8.5 3.8 1.5l2.9-2.9A10 10 0 0 0 3.1 7.4L6.4 10c.8-2.3 3-4.1 5.6-4.1Z" fill="#EA4335"/></svg>`
export const GITHUB = `<svg viewBox="0 0 24 24"><path fill="#FFFFFF" d="M12 2a10 10 0 0 0-3.2 19.5c.5.1.7-.2.7-.5v-1.7c-2.8.6-3.4-1.3-3.4-1.3-.4-1.2-1.1-1.5-1.1-1.5-.9-.6.1-.6.1-.6 1 .1 1.5 1 1.5 1 .9 1.5 2.4 1.1 2.9.8.1-.7.4-1.1.6-1.3-2.2-.3-4.6-1.1-4.6-5 0-1.1.4-2 1-2.7-.1-.3-.4-1.3.1-2.7 0 0 .8-.3 2.8 1a9.6 9.6 0 0 1 5 0c1.9-1.3 2.8-1 2.8-1 .5 1.4.2 2.4.1 2.7.6.7 1 1.6 1 2.7 0 3.9-2.4 4.7-4.6 5 .4.3.7.9.7 1.9V21c0 .3.2.6.7.5A10 10 0 0 0 12 2Z"/></svg>`
export const GITHUB_BG = '#16191D'
export const APPLE = `<svg viewBox="0 0 24 24"><path fill="#FFFFFF" d="M16.4 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.8-3.5.8s-1.8-.8-3-.8c-1.5 0-3 .9-3.8 2.3-1.6 2.8-.4 7 1.2 9.3.8 1.1 1.7 2.3 2.9 2.3 1.2 0 1.6-.7 3-.7s1.8.7 3 .7 2-.1 2.9-2.3c.7-1 1-2 1-2.1-.1 0-1.9-.7-1.9-2.9zM14.5 6.2c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z"/></svg>`
export const APPLE_BG = '#000000'

export const PROVIDER_LABEL = { google: 'Google', apple: 'Apple', github: 'GitHub' } as const
export const PROVIDER_ORDER = ['google', 'apple', 'github'] as const
export const FAILURE_BODY = '잠시 후 다시 시도하거나 다른 방법으로 계속해 주세요.'

export const GOOGLE_START = 'Google로 시작하기'
export const APPLE_START = 'Apple로 시작하기'
export const GITHUB_START = 'GitHub로 시작하기'
export const PHONE_START = '휴대폰 번호로 시작하기'

export const PHONE_TITLE = '휴대폰 번호를 입력해 주세요'
export const PHONE_BODY = '지원 결과와 면접 일정을 알려 드릴 번호예요.\n다른 사람에게는 보이지 않아요.'
export const SEND_CODE = '인증번호 받기'
export const OTP_TITLE = '인증번호를 입력해 주세요'
export const CHANGE_NUMBER = '번호 바꾸기'
export const CONFIRM = '확인'
export const OTP_INVALID = '인증번호가 맞지 않아요. 다시 확인해 주세요.'
export const OTP_EXPIRED = '인증번호가 만료됐어요. 새 번호를 받아 주세요.'
export const RESEND_CODE = '인증번호 다시 받기'
export const TOO_MANY_TITLE = '인증번호를 5번 잘못 입력했어요'
export const TOO_MANY_BODY = '새 인증번호를 받아 다시 입력해 주세요.'
export const REGISTERED_TITLE = '이미 가입된 번호예요'
export const OTHER_NUMBER = '다른 번호 입력하기'
export const TERMS_TITLE = '서비스 이용에 동의해 주세요'
export const TERMS_BODY = '필수 항목에 동의하면 시작할 수 있어요.'
export const TERMS_ALL = '전체 동의'
export const TERMS_REQUIRED = '필수'
export const TERMS_OPTIONAL = '선택'
export const TERMS_START = '동의하고 시작하기'
export const TERMS_VERSION = '2026-10-29'
export const PHONE_UNAVAILABLE = '지금은 인증번호를 보낼 수 없어요. 잠시 후 다시 시도해 주세요.'
export const PHONE_TAKEN = '이 번호로 로그인할 수 없어요. 다른 번호로 시도해 주세요.'
export const PENDING_EXPIRED = '로그인 시간이 지났어요. 다시 로그인해 주세요.'
export const TRY_AGAIN = '잠시 후 다시 시도해 주세요.'

export const TERM_ROWS = [
  { id: 'age14', label: '만 14세 이상이에요', required: true },
  { id: 'serviceTerms', label: '서비스 이용약관', required: true },
  { id: 'privacy', label: '개인정보 수집·이용', required: true },
  { id: 'marketing', label: '혜택·이벤트 알림 받기', required: false },
] as const
