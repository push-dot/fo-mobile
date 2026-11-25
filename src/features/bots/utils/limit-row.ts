export const limitRowMeta = (title: string | null | undefined, time: string) => (title ? `${title} · ${time}` : time)
