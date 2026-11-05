import { useEffect } from 'react'
import { AccessibilityInfo, Platform, Pressable, View } from 'react-native'
import { Glass, Icon, Text } from '@/shared/components'
import { useColors } from '../../../theme'

const Toast = ({
  text,
  action,
  error,
  onHide,
}: {
  text: string | null
  action?: { label: string; onPress: () => void } | null
  error?: boolean
  onHide: () => void
}) => {
  const c = useColors()
  useEffect(() => {
    if (!text) return
    void AccessibilityInfo.announceForAccessibility(text)
    const t = setTimeout(onHide, 2500)
    return () => clearTimeout(t)
  }, [text, onHide])
  if (!text) return null
  const body = (
    <View
      style={{
        flexDirection: 'row',
        alignItems: 'center',
        gap: 10,
        minHeight: 52,
        paddingHorizontal: 16,
      }}
    >
      <View
        style={{
          width: 22,
          height: 22,
          borderRadius: 11,
          backgroundColor: error ? c.red : c.green,
          alignItems: 'center',
          justifyContent: 'center',
        }}
      >
        {error ? (
          <Text v="c1" weight="800" style={{ color: '#FFFFFF' }}>
            !
          </Text>
        ) : (
          <Icon name="check" size={14} color="#FFFFFF" />
        )}
      </View>
      <Text v="b2" weight="600" style={{ flex: 1, color: Platform.OS === 'ios' ? c.t1 : c.bg }}>
        {text}
      </Text>
      {action ? (
        <Pressable accessibilityRole="button" onPress={action.onPress} hitSlop={8}>
          <Text v="b2" weight="700" style={{ color: Platform.OS === 'ios' ? c.acText : c.bg }}>
            {action.label}
          </Text>
        </Pressable>
      ) : null}
    </View>
  )
  return (
    <View
      accessibilityLiveRegion="polite"
      style={{ position: 'absolute', left: 20, right: 20, bottom: 24, zIndex: 8 }}
    >
      {Platform.OS === 'ios' ? (
        <Glass style={{ borderRadius: 18 }}>{body}</Glass>
      ) : (
        <View style={{ borderRadius: 18, backgroundColor: c.t1 }}>{body}</View>
      )}
    </View>
  )
}

export default Toast
