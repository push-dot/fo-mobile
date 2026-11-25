export const ingestEnabled = (jobId: string | undefined, live: boolean): boolean => Boolean(jobId) && live
