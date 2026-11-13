import type { ReactNode } from 'react'
import { Modal, Platform, Pressable, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Text, ToastHost } from '@/shared/components'
import { GRABBER } from '@/shared/components/constants'
import { radius, spacing, useColors } from '../../../../theme'

const FLOAT_RADIUS = 40

export const SheetCard = ({ label, title, onClose, children }: { label: string; title?: string; onClose: () => void; children: ReactNode }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const float = Platform.OS === 'ios'
  const card = float
    ? {
        backgroundColor: c.bg,
        margin: spacing[2],
        borderRadius: FLOAT_RADIUS,
        paddingHorizontal: spacing[4],
        paddingTop: spacing[3],
        paddingBottom: spacing[5],
        gap: spacing[2],
      }
    : {
        backgroundColor: c.bg,
        borderTopLeftRadius: radius.sheetTop,
        borderTopRightRadius: radius.sheetTop,
        paddingHorizontal: spacing[5],
        paddingTop: spacing[3],
        paddingBottom: insets.bottom + spacing[3],
        gap: 14,
      }
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      {/* The scrim is not one accessibility element: a grouping Pressable hides the sheet's rows from VoiceOver and Maestro. */}
      <Pressable accessible={false} onPress={onClose} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim }}>
        <Pressable accessible={false} accessibilityLabel={label} onPress={() => undefined} style={card}>
          <View
            style={{
              ...(float ? GRABBER.ios : GRABBER.android),
              backgroundColor: c.deco,
              alignSelf: 'center',
            }}
          />
          {title ? (
            <Text v="h3" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
      {/* iOS: the root ToastHost sits under this modal (허용 해제 toast); Android shows the root one. */}
      {float ? <ToastHost /> : null}
    </Modal>
  )
}
