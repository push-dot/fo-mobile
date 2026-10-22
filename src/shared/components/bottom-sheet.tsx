import type { ReactNode } from 'react'
import { Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useColors } from '../../theme'
import Button from './button'
import Glass from './glass'
import Icon from './icon'
import Text from './text'

type Props = {
  visible: boolean
  onClose: () => void
  title?: string
  description?: string
  children: ReactNode
  action?: { label: string; onPress: () => void; disabled?: boolean }
  full?: boolean
}

const BottomSheet = ({ visible, onClose, title, description, children, action, full }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const body = (
    <View style={{ paddingTop: 12, paddingHorizontal: 16, paddingBottom: ios ? 16 : 16 + insets.bottom, gap: 14, maxHeight: '100%', flexShrink: 1 }}>
      <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: c.t4, opacity: 0.6, alignSelf: 'center' }} />
      {title ? (
        <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: 12 }}>
          <View style={{ flex: 1, gap: 2 }}>
            <Text v="h2" accessibilityRole="header">
              {title}
            </Text>
            {description ? (
              <Text v="b2" color="t3">
                {description}
              </Text>
            ) : null}
          </View>
          <Pressable
            accessibilityRole="button"
            accessibilityLabel="닫기"
            onPress={onClose}
            style={{ width: 36, height: 36, borderRadius: 18, backgroundColor: c.fill, alignItems: 'center', justifyContent: 'center' }}
          >
            <Icon name="x" size={18} />
          </Pressable>
        </View>
      ) : null}
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: 12 }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} /> : null}
    </View>
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityLabel="닫기" onPress={onClose} style={{ flex: 1, backgroundColor: c.scrim }} />
      <View
        style={{
          position: 'absolute',
          left: ios ? 8 : 0,
          right: ios ? 8 : 0,
          bottom: ios ? Math.max(insets.bottom, 8) : 0,
          top: full ? insets.top + 8 : undefined,
          maxHeight: full ? undefined : '88%',
        }}
      >
        {ios ? (
          <Glass surface="sheet" style={{ borderRadius: 40, overflow: 'hidden', flexShrink: 1, height: full ? '100%' : undefined }}>
            {body}
          </Glass>
        ) : (
          <View style={{ backgroundColor: c.bg, borderTopLeftRadius: 28, borderTopRightRadius: 28, flexShrink: 1, height: full ? '100%' : undefined }}>
            {body}
          </View>
        )}
      </View>
    </Modal>
  )
}

export default BottomSheet
