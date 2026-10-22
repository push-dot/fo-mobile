import { useCallback, useState } from 'react'

export const useToast = () => {
  const [text, setText] = useState<string | null>(null)
  const hide = useCallback(() => setText(null), [])
  return { text, show: setText, hide }
}
