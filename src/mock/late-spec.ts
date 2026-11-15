/** `bot:<id>:late` lands a bot answer in the open chat at once; `bot:<id>:late:<ms>` lands it after the delay, so a tour can scroll up first without opening another link. */
export const lateSpec = (spec: string) => {
  const m = /^bot:([^:]+):late(?::(\d+))?$/.exec(spec)
  return m ? { bot: m[1]!, delayMs: Number(m[2] ?? 0) } : null
}
