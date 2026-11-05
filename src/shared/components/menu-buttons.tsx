import { Button } from '@expo/ui/swift-ui'
import type { MenuAction } from './menu-action'

/** iOS: menu actions as SwiftUI buttons inside a UIMenu. */
const MenuButtons = ({ actions }: { actions: MenuAction[] }) => (
  <>
    {actions.map((a) => (
      <Button
        key={a.key}
        label={a.label}
        systemImage={a.selected ? 'checkmark' : a.systemImage}
        role={a.destructive ? 'destructive' : undefined}
        onPress={a.onPress}
      />
    ))}
  </>
)

export default MenuButtons
