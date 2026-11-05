export const nextEventFor = <T extends { applicationId?: string | null; startsAt: string }>(events: T[], applicationId: string) =>
  events.filter((e) => e.applicationId === applicationId).sort((a, b) => a.startsAt.localeCompare(b.startsAt))[0] ?? null
