import { useEffect } from 'react'
import { Platform, View } from 'react-native'
import { Glass, Icon, Text } from '../../../shared/components'
import { useColors } from '../../../theme'

const PostingToast = ({ text, bottom, onHide }: { text: string; bottom: number; onHide: () => void }) => {
  const c = useColors()
  useEffect(() => {
    const t = setTimeout(onHide, 3000)
    return () => clearTimeout(t)
  }, [onHide])
  const ios = Platform.OS === 'ios'
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, minHeight: 52, paddingHorizontal: 16 }}>
      <View style={{ width: 22, height: 22, borderRadius: 11, backgroundColor: c.green, alignItems: 'center', justifyContent: 'center' }}>
        <Icon name="check" size={14} color="#FFFFFF" />
      </View>
      <Text v="b2" weight="600" style={{ flex: 1, color: ios ? c.t1 : c.bg }}>
        {text}
      </Text>
    </View>
  )
  return (
    <View accessibilityLiveRegion="polite" accessibilityRole="alert" style={{ position: 'absolute', left: 20, right: 20, bottom, zIndex: 8 }}>
      {ios ? <Glass style={{ borderRadius: 18 }}>{row}</Glass> : <View style={{ borderRadius: 18, backgroundColor: c.t1 }}>{row}</View>}
    </View>
  )
}

export default PostingToast
