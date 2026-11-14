/** BotNewLimitDelete's second line: the role the bot was made from, then the time of its last activity. A bot whose posting is gone shows the time alone. */
export const limitRowMeta = (title: string | null | undefined, time: string) => (title ? `${title} · ${time}` : time)
