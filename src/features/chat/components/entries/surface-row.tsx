import { A2uiSurface, type A2uiLocal } from '@/shared/components'
import { useChatWaiting } from '../../hooks'
import { answerSurface } from '../../stores'
import type { SurfaceItem } from '../../utils/surface'
import Appear from '../motion'

const SurfaceRow = ({ chatId, item, onLocal }: { chatId: string; item: SurfaceItem; onLocal?: (item: SurfaceItem, action: A2uiLocal) => void }) => {
  const waiting = useChatWaiting(chatId)
  return (
    <Appear>
      <A2uiSurface
        messages={item.messages}
        interactive={waiting === item.id}
        onAnswer={(surfaceId, body) => answerSurface(chatId, surfaceId, body)}
        onLocal={(_, action) => onLocal?.(item, action)}
      />
    </Appear>
  )
}

export default SurfaceRow
