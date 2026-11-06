export const cacheName = (name: string) => {
  const safe = name.replace(/[^\w.가-힣-]/g, '_')
  return /^\.*$/.test(safe) ? 'artifact' : safe
}
