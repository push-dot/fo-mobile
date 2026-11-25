export const lateSpec = (spec: string) => {
  const m = /^bot:([^:]+):late(?::(\d+))?$/.exec(spec)
  return m ? { bot: m[1]!, delayMs: Number(m[2] ?? 0) } : null
}
