import { QUICK_STARTS, type QsInput } from '../constants'

const NO_INPUT: QsInput = { picked: [], url: '', chips: [], option: false, task: '', custom: '' }

export const instantRun = (key: string) => {
  const qs = QUICK_STARTS.find((item) => item.key === key)
  return qs?.instant ? (qs.start(NO_INPUT) ?? null) : null
}
