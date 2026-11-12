// The mascot of the 2026-11-12 boards, in the units of its 100 × 100 viewBox.

export const BODY = 'M36 10H68L90 32V78a12 12 0 0 1-12 12H22a12 12 0 0 1-12-12V36A26 26 0 0 1 36 10Z'
export const FOLD_OUT = 'M68 10 90 32H76a8 8 0 0 1-8-8Z'
export const FOLD_IN = 'M72 14 86 28H76a4 4 0 0 1-4-4Z'

export const MOUTH = {
  d: 'M-6.5-6.2c4.4-.8 8.6-.8 13 0 .9.2 1.3 1 .8 1.8l-2.8 4.2 4.6 7.4c1 1.6-.1 3.6-2 3.6H-7.1c-1.9 0-3-2-2-3.6L-4.5-.2l-2.8-4.2c-.5-.8-.1-1.6.8-1.8Z',
  transform: 'translate(56 75.3) scale(1.36)',
}

export const EYE = { rx: 9.4, ry: 11.9, tilt: 33, pupilRx: 3.3, pupilRy: 3.9 }

/** Each eye with its pupil looking ahead (`open`) and looking up (`up`). */
export const EYES_AT = [
  { x: 39.3, y: 46, open: { x: 37.4, y: 41.2 }, up: { x: 38.9, y: 39.2 } },
  { x: 67.6, y: 54.6, open: { x: 65.4, y: 49.6 }, up: { x: 66.9, y: 47.6 } },
]

/** Half the side of the square layer an eye is drawn in. It covers the tilted ellipse. */
export const EYE_REACH = 13

/** How far both eyes move when they look up. */
export const LOOK_UP = { x: 2.5, y: -4 }

export const SMILES = ['M30.5 49 q8.8 -11 17.6 0', 'M58.8 57.6 q8.8 -11 17.6 0']
export const SMILE_WIDTH = 5.2

export const DOTS = { xs: [64, 76, 88], y: -1, r: 4.6 }

export const BADGE = { x: 90, y: 6, r: 13, bar: 'M90 0v7.5', barWidth: 3.4, dotY: 12.6, dotR: 2 }

/** Each spark with the centre and half side of the square it fills. */
export const SPARKS = [
  { d: 'M6 -1Q6 8 15 8Q6 8 6 17Q6 8 -3 8Q6 8 6 -1Z', x: 6, y: 8, reach: 9 },
  { d: 'M96 -5Q96 2 103 2Q96 2 96 9Q96 2 89 2Q96 2 96 -5Z', x: 96, y: 2, reach: 7 },
  { d: 'M100 39Q100 44 105 44Q100 44 100 49Q100 44 95 44Q100 44 100 39Z', x: 100, y: 44, reach: 5 },
]

/** The badge reaches 7 units above and 3 to the right of the body's box. */
export const PAD = 12

/** The unread dot of the 52 px list avatar, as shares of the mascot's size: the dot, the ring around it, and how far it sits outside the corner. */
export const UNREAD = { dot: 14 / 52, ring: 2.5 / 52, out: 3 / 52 }
