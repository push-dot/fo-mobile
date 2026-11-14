import { spacing } from '../../../../theme'

export const homeChrome = (xl: boolean) => ({
  header: xl ? 68 : 60,
  avatar: xl ? 52 : 44,
  hero: xl ? 72 : 96,
  rowMascot: 52,
  nameSize: xl ? 22 : 16,
  nameLine: xl ? 29 : 22,
  nameLines: xl ? 2 : 1,
  timeSize: xl ? 16 : 12,
  timeLine: xl ? 29 : 16,
  msgSize: xl ? 19 : 14,
  msgLine: xl ? 27 : 20,
  msgLines: xl ? 3 : 2,
  heroNameSize: xl ? 24 : 17,
  heroNameLine: xl ? 32 : 24,
  control: xl ? 52 : 44,
  barGap: xl ? 8 : 10,
  rowAlign: xl ? ('flex-start' as const) : ('center' as const),
  mascotTop: xl ? 2 : 0,
  rowGap: xl ? spacing[3] : 14,
  // The board's 8pt gap would clip the title one glyph early: iOS widens a Korean space to 0.28em, so 한빛모빌리티 자율주행 데이터플랫폼팀 needs ~3pt more than the board's render.
  nameGap: xl ? spacing[2] : 4,
  rowPadH: xl ? 16 : 20,
  rowPadV: xl ? 12 : 10,
  sectSize: xl ? 17 : 13,
  sectLine: xl ? 24 : 18,
})

export type HomeChrome = ReturnType<typeof homeChrome>
