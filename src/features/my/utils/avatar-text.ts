import { AVATAR_TEXT } from '../constants'

export const avatarTextSize = (size: number) => AVATAR_TEXT[size] ?? Math.round(size * 0.31)
