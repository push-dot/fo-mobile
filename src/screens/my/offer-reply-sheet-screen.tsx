import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Keyboard, Text as RNText } from 'react-native'
import { dbg, dbgLog } from '@/shared/components/glass-pressable'
import { counterpart, ListSkeleton, RETRY_LABEL, useOffer, useOfferDecision } from '@/features/my'
import { Sheet, TextField } from '@/shared/components'

const TITLE = '어떻게 답장할까요?'

const OfferReplySheetScreen = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  const [reply, setReply] = useState('')
  const offer = useOffer(id)
  const { accept } = useOfferDecision(id, reply, () => router.back())
  const o = offer.data
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((n) => n + 1), 300)
    const a = Keyboard.addListener('keyboardDidShow', () => dbg('kshow'))
    const b = Keyboard.addListener('keyboardDidHide', () => dbg('khide'))
    return () => { clearInterval(t); a.remove(); b.remove() }
  }, [])
  useEffect(() => { dbg(`mut:${accept.status}`) }, [accept.status])
  if (!o)
    return (
      <Sheet
        title={TITLE}
        action={offer.isPending ? undefined : { label: RETRY_LABEL, onPress: () => void offer.refetch() }}
      >
        {offer.isPending ? <ListSkeleton count={2} /> : null}
      </Sheet>
    )
  const who = counterpart(o, 'received')
  return (
    <Sheet
      title={TITLE}
      description="수락하면 내 연락처가 상대에게 보이고, 답장이 첫 메시지가 돼요."
      action={{
        label: accept.isPending ? '보내는 중' : '수락하고 보내기',
        onPress: () => { dbg('onPress'); accept.mutate() },
        pending: accept.isPending,
      }}
    >
      <TextField
        accessibilityLabel="답장"
        multiline
        maxLength={500}
        value={reply}
        onChangeText={setReply}
        editable={!accept.isPending}
        style={{ minHeight: 72 }}
        placeholder={`${who.displayName} 님에게 답장을 써 주세요.`}
      />
      <RNText accessibilityLabel={`DBG ${dbgLog.slice(-12).join(' ')}`}>{`DBG ${dbgLog.slice(-12).join(' ')}`}</RNText>
    </Sheet>
  )
}

export default OfferReplySheetScreen
