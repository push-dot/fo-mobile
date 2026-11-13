import { Modal, Platform, Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Blur, Button, Text } from '@/shared/components'
import { SheetSurface } from '@/shared/components/glass'
import { radius, spacing, useColors } from '@/theme'

const ios = Platform.OS === 'ios'
const GRAB = { width: 36, height: 5, borderRadius: 3 }
// `.ios .sheet2`: the sheet floats 8pt in from the screen edges with 40pt corners.
const IOS_FLOAT = 8
const IOS_CORNER = 40
const IOS_BLUR = 40

type Props = {
  visible: boolean
  title: string
  body: string
  onCancel: () => void
  onConfirm: () => void
  /** iOS: the confirm has faded out (Modal onDismiss). */
  onHidden: () => void
}

/**
 * MaterialDetailDelete: the confirm over the detail sheet, which stays in view, dimmed, under it. The shared confirm is a
 * second native sheet, and iOS takes the sheet under it off screen, so this one is drawn in a modal over the sheet.
 */
export const DeleteConfirm = ({ visible, title, body, onCancel, onConfirm, onHidden }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const card = ios
    ? {
        left: IOS_FLOAT,
        right: IOS_FLOAT,
        bottom: IOS_FLOAT,
        borderRadius: IOS_CORNER,
        paddingTop: spacing[3],
        paddingHorizontal: spacing[4],
        paddingBottom: spacing[5],
      }
    : {
        left: 0,
        right: 0,
        bottom: 0,
        borderTopLeftRadius: radius.sheetTop,
        borderTopRightRadius: radius.sheetTop,
        backgroundColor: c.bg,
        paddingTop: spacing[3],
        paddingHorizontal: spacing[5],
        paddingBottom: insets.bottom + spacing[3],
      }
  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      statusBarTranslucent
      navigationBarTranslucent
      onRequestClose={onCancel}
      onDismiss={onHidden}
    >
      <View style={{ flex: 1, backgroundColor: c.scrim }}>
        <Pressable accessible={false} onPress={onCancel} style={StyleSheet.absoluteFill} />
        <View
          accessibilityViewIsModal
          style={{ position: 'absolute', overflow: 'hidden', gap: spacing[2], ...card }}
        >
          {ios ? (
            <>
              <Blur intensity={IOS_BLUR} style={StyleSheet.absoluteFill} />
              <View style={[StyleSheet.absoluteFill, { backgroundColor: c.sheet }]} />
            </>
          ) : null}
          <View style={{ ...GRAB, backgroundColor: c.deco, alignSelf: 'center' }} />
          <SheetSurface.Provider value={ios}>
            <View accessibilityRole="alert" style={{ gap: spacing[2] }}>
              <Text v="h3" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
                {title}
              </Text>
              <Text v="b2" color="t2">
                {body}
              </Text>
            </View>
            <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
              <Button label="취소" variant="secondary" onPress={onCancel} style={{ flex: 1 }} />
              <Button label="삭제" variant="danger" onPress={onConfirm} style={{ flex: 1 }} />
            </View>
          </SheetSurface.Provider>
        </View>
      </View>
    </Modal>
  )
}
