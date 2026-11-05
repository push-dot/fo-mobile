import { Menu as SwiftMenu, RNHostView } from '@expo/ui/swift-ui'
import { accessibilityLabel as a11yLabel } from '@expo/ui/swift-ui/modifiers'
import type { MenuProps } from './menu-action'
import MenuButtons from './menu-buttons'
import NativeHost from './native-host'

/** iOS: pull-down UIMenu on tap. Pass a non-pressable trigger; the menu owns the tap. */
const Menu = ({ actions, accessibilityLabel, children, stretch }: MenuProps) => (
  <NativeHost matchContents={stretch ? { vertical: true } : true}>
    <SwiftMenu label={<RNHostView matchContents={stretch ? { vertical: true } : true}>{children}</RNHostView>} modifiers={[a11yLabel(accessibilityLabel)]}>
      <MenuButtons actions={actions} />
    </SwiftMenu>
  </NativeHost>
)

export default Menu
