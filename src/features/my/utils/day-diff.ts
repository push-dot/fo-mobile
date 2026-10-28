import { DAY } from '../constants'

const startOfDay = (d: Date) => new Date(d.getFullYear(), d.getMonth(), d.getDate())
export const dayDiff = (a: Date, b: Date) =>
  Math.round((startOfDay(a).getTime() - startOfDay(b).getTime()) / DAY)

export const sameDay = (a: Date, b: Date) => dayDiff(a, b) === 0
