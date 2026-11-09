import { AVATAR_TEXT } from '../constants'

/** Initials size of a person avatar: the boards' size where they draw one, else the 84/26 ratio. */
export const avatarTextSize = (size: number) => AVATAR_TEXT[size] ?? Math.round(size * 0.31)
