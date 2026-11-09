import { useEffect, useState } from 'react'
import { SEARCH_DEBOUNCE_MS } from './constants'

/** The search text and the query it runs: typing waits SEARCH_DEBOUNCE_MS, `search` (taps, submit, clear) runs at once. */
export const useSearchQuery = () => {
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = text.trim()
    const id = setTimeout(() => setQ(t), t ? SEARCH_DEBOUNCE_MS : 0)
    return () => clearTimeout(id)
  }, [text])
  const search = (t: string) => {
    setText(t)
    setQ(t.trim())
  }
  return { text, q, setText, search }
}
