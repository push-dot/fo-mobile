import { useEffect, useState } from 'react'
import type { Approval } from '../../types'
import { cardState, type CardState } from '../../utils/card'

/**
 * The card's state now. The clock is read when the card mounts and when its timer fires at `expiresAt`, so a retry that moves
 * `expiresAt` past the last reading re-opens the card without a read in between.
 */
export const useCardState = (card: Pick<Approval, 'expiresAt'> | null): CardState => {
  const [now, setNow] = useState(() => Date.now())
  const expiresAt = card?.expiresAt
  useEffect(() => {
    if (expiresAt === undefined) return
    // Timers can fire a hair early; the extra 50 ms keeps the clock past expiresAt.
    const timer = setTimeout(() => setNow(Date.now()), Math.max(0, expiresAt - Date.now()) + 50)
    return () => clearTimeout(timer)
  }, [expiresAt])
  return card ? cardState(card, now) : 'open'
}
