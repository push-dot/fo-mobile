/** Whether the ingest job query should run (and poll when configured). */
export const ingestEnabled = (jobId: string | undefined, live: boolean): boolean => Boolean(jobId) && live
