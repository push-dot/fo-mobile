import { Button, Section } from '@expo/ui/swift-ui'
import { tint } from '@expo/ui/swift-ui/modifiers'
import { useColors } from '../../theme'
import { menuSections, type MenuAction, type MenuSection } from './menu-action'

const buttons = (actions: MenuAction[], red: string) =>
  actions.map((a) => (
    <Button
      key={a.key}
      label={a.label}
      systemImage={a.selected ? 'checkmark' : a.systemImage}
      role={a.destructive ? 'destructive' : undefined}
      modifiers={a.destructive ? [tint(red)] : undefined}
      onPress={a.onPress}
    />
  ))

const MenuButtons = ({ actions }: { actions: MenuAction[] | MenuSection[] }) => {
  const { red } = useColors()
  const sections = menuSections(actions)
  if (sections.length === 1 && !sections[0]!.title) return buttons(sections[0]!.actions, red)
  return sections.map((s) => (
    <Section key={s.key} title={s.title}>
      {buttons(s.actions, red)}
    </Section>
  ))
}

export default MenuButtons
