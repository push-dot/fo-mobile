import { useEffect, useState } from 'react'

export const useDebouncedQuery = (delay: number) => {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = text.trim()
    const id = setTimeout(() => setQ(t), t ? delay : 0)
    return () => clearTimeout(id)
  }, [text, delay])
  const search = (t: string) => {
    setText(t)
    setQ(t.trim())
  }
  return { text, q, setText, search }
}
