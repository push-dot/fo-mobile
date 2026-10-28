export const cacheName = (name: string) => name.replace(/[^\w.가-힣-]/g, '_') || 'artifact'
