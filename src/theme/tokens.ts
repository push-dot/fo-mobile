export const palette = {
  light: {
    bg: '#FFFFFF',
    bg2: '#F4F5F7',
    card: '#FFFFFF',
    fill: '#F2F3F5',
    fill2: '#E9EBEE',
    line: '#EBEDF0',
    t1: '#16191D',
    t2: '#4B525C',
    t3: '#848C96',
    t4: '#B4BAC2',
    ac: '#5B4CF0',
    acSoft: '#EFEDFF',
    acText: '#4A3BDF',
    acPress: '#4A3BDF',
    green: '#0E9F55',
    greenSoft: '#E6F6EE',
    red: '#E5484D',
    redSoft: '#FDEEEE',
    orange: '#EB6A00',
    orangeSoft: '#FFF2E6',
    scrim: 'rgba(0,0,0,0.4)',
    paper: '#FFFFFF',
    glass: 'rgba(255,255,255,0.6)',
    sheet: 'rgba(250,250,252,0.84)',
  },
  dark: {
    bg: '#0F1012',
    bg2: '#17181B',
    card: '#1C1E22',
    fill: '#24272C',
    fill2: '#2E3238',
    line: '#2A2D33',
    t1: '#F3F4F6',
    t2: '#C2C7CE',
    t3: '#8C939C',
    t4: '#5C636C',
    ac: '#7464FF',
    acSoft: 'rgba(116,100,255,0.18)',
    acText: '#A69CFF',
    acPress: '#6555F0',
    green: '#3CCB7F',
    greenSoft: 'rgba(60,203,127,0.14)',
    red: '#FF6B6F',
    redSoft: 'rgba(255,107,111,0.14)',
    orange: '#FF9A3D',
    orangeSoft: 'rgba(255,154,61,0.14)',
    scrim: 'rgba(0,0,0,0.6)',
    paper: '#24272C',
    glass: 'rgba(44,46,52,0.58)',
    sheet: 'rgba(32,34,38,0.86)',
  },
} as const

export type Colors = { [K in keyof typeof palette.light]: string }

const ls = (size: number, em: number) => size * em

export const type = {
  h1: { fontSize: 26, lineHeight: 36, fontWeight: '800', letterSpacing: ls(26, -0.03) },
  h2: { fontSize: 20, lineHeight: 28, fontWeight: '700', letterSpacing: ls(20, -0.025) },
  h3: { fontSize: 17, lineHeight: 24, fontWeight: '700', letterSpacing: ls(17, -0.02) },
  b1: { fontSize: 16, lineHeight: 24, fontWeight: '400', letterSpacing: ls(16, -0.02) },
  b2: { fontSize: 15, lineHeight: 22, fontWeight: '400', letterSpacing: ls(15, -0.02) },
  c1: { fontSize: 13, lineHeight: 18, fontWeight: '400', letterSpacing: ls(13, -0.02) },
  c2: { fontSize: 12, lineHeight: 16, fontWeight: '400', letterSpacing: ls(12, -0.02) },
} as const

export type TypeName = keyof typeof type

export const radius = { xs: 6, sm: 12, md: 16, lg: 20, xl: 28, pill: 999 } as const

export const shadow = {
  light: {
    pop: { shadowColor: '#16191D', shadowOpacity: 0.1, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
    glass: { shadowColor: '#000000', shadowOpacity: 0.1, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  },
  dark: {
    pop: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 14, shadowOffset: { width: 0, height: 8 } },
    glass: { shadowColor: '#000000', shadowOpacity: 0.5, shadowRadius: 12, shadowOffset: { width: 0, height: 6 } },
  },
} as const
