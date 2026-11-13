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
  rowGap: xl ? spacing[3] : 14,
  rowPadH: xl ? 16 : 20,
  rowPadV: xl ? 12 : 10,
  sectSize: xl ? 17 : 13,
  sectLine: xl ? 24 : 18,
})

export type HomeChrome = ReturnType<typeof homeChrome>
