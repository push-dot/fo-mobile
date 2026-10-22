import { useEffect, useRef } from 'react'
import { Platform, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Glass, Icon, Text } from '../../../shared/components'
import { useColors } from '../../../theme'

const ApplyToast = ({ message, onHide, bottom }: { message: string | null; onHide: () => void; bottom?: number }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const hide = useRef(onHide)
  useEffect(() => {
    hide.current = onHide
  })
  useEffect(() => {
    if (!message) return
    const t = setTimeout(() => hide.current(), 3000)
    return () => clearTimeout(t)
  }, [message])
  if (!message) return null
  const ios = Platform.OS === 'ios'
  const content = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <Text v="b2" weight="600" style={{ flex: 1, color: ios ? c.t1 : c.bg }}>
        {message}
      </Text>
    </View>
  )
  const style = { borderRadius: 18, overflow: 'hidden' as const }
  return (
    <View
      accessibilityLiveRegion="polite"
      accessibilityRole="alert"
      pointerEvents="none"
      style={{ position: 'absolute', left: 20, right: 20, bottom: bottom ?? insets.bottom + 92, zIndex: 8 }}
    >
      {ios ? <Glass style={style}>{content}</Glass> : <View style={[style, { backgroundColor: c.t1 }]}>{content}</View>}
    </View>
  )
}

export default ApplyToast
