import { ContextMenu as SwiftContextMenu, RNHostView } from '@expo/ui/swift-ui'
import { Pressable, useWindowDimensions } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import type { ContextMenuProps } from './menu-action'
import MenuButtons from './menu-buttons'
import { useColors } from '../../theme'
import NativeHost from './native-host'

const ContextMenu = ({ actions, accessibilityLabel, onPress, preview, children }: ContextMenuProps) => {
  const { width } = useWindowDimensions()
  return (
    <NativeHost matchContents={{ vertical: true }} ignoreSafeArea="all" seedColor={useColors().t1}>
      <SwiftContextMenu>
        <SwiftContextMenu.Items>
          <MenuButtons actions={actions} />
        </SwiftContextMenu.Items>
        <SwiftContextMenu.Trigger>
          <RNHostView matchContents={{ vertical: true }}>
            <Pressable accessibilityRole="button" accessibilityLabel={accessibilityLabel} onPress={onPress} style={styles.trigger(width)}>
              {children}
            </Pressable>
          </RNHostView>
        </SwiftContextMenu.Trigger>
        {preview ? (
          <SwiftContextMenu.Preview>
            <RNHostView matchContents>{preview}</RNHostView>
          </SwiftContextMenu.Preview>
        ) : null}
      </SwiftContextMenu>
    </NativeHost>
  )
}

const styles = StyleSheet.create({
  trigger: (width: number) => ({ maxWidth: width }),
})

export default ContextMenu
