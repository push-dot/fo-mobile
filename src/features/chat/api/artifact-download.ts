export type ArtifactDeps = {
  get: (path: string) => Promise<Response>
  save: (name: string, bytes: Uint8Array) => Promise<string>
}

export const cacheName = (name: string) => name.replace(/[^\w.가-힣-]/g, '_') || 'artifact'

export const downloadArtifact = async (deps: ArtifactDeps, downloadUrl: string, name: string) => {
  const res = await deps.get(downloadUrl)
  return deps.save(cacheName(name), new Uint8Array(await res.arrayBuffer()))
}
