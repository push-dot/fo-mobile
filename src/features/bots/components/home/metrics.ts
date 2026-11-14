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
  // The board's 한빛모빌리티 자율주행 데이터플랫폼팀 fits its box by 0.1pt (251.4 in 251.5); native text widths round up to the pixel grid, so an 8pt gap clips its
  // last glyph. 7pt leaves 0.7pt, and still clips 누리클라우드 플랫폼엔지니어링코리아… at the same glyph as the board (a 6pt gap would show one more).
  nameGap: xl ? spacing[2] : 7,
  rowPadH: xl ? 16 : 20,
  rowPadV: xl ? 12 : 10,
  sectSize: xl ? 17 : 13,
  sectLine: xl ? 24 : 18,
})

export type HomeChrome = ReturnType<typeof homeChrome>
