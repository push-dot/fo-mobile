import type { ReactNode } from 'react'
import { KeyboardAvoidingView, Modal, Platform, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { radius, spacing, useColors } from '../../theme'
import Button from './button'
import Glass from './glass'
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

const notScreenSized = { position: 'absolute', top: -1, left: 0, right: 0, bottom: 0 } as const

const BottomSheet = ({ visible, onClose, title, description, children, action, full }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const ios = Platform.OS === 'ios'
  const body = (
    <View style={{ paddingTop: spacing[3], paddingHorizontal: spacing[4], paddingBottom: ios ? spacing[4] : spacing[4] + insets.bottom, gap: 14, maxHeight: '100%', flexShrink: 1 }}>
      <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: c.deco, alignSelf: 'center' }} />
      {title ? (
        <View style={{ gap: 2 }}>
          <Text v="h2" accessibilityRole="header">
            {title}
          </Text>
          {description ? (
            <Text v="b2" color="t3">
              {description}
            </Text>
          ) : null}
        </View>
      ) : null}
      <ScrollView style={{ flexGrow: 0, flexShrink: 1 }} contentContainerStyle={{ gap: spacing[3] }} keyboardShouldPersistTaps="handled">
        {children}
      </ScrollView>
      {action ? <Button label={action.label} onPress={action.onPress} disabled={action.disabled} /> : null}
    </View>
  )
  return (
    <Modal visible={visible} transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable accessibilityRole="button" accessibilityLabel="닫기" onPress={onClose} style={[notScreenSized, { backgroundColor: c.scrim }]} />
      <KeyboardAvoidingView
        behavior="padding"
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
          <View style={{ backgroundColor: c.bg, borderTopLeftRadius: radius.sheetTop, borderTopRightRadius: radius.sheetTop, flexShrink: 1, height: full ? '100%' : undefined }}>
            {body}
          </View>
        )}
      </KeyboardAvoidingView>
    </Modal>
  )
}

export default BottomSheet
