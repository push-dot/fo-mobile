import { Button, Section } from '@expo/ui/swift-ui'
import { menuSections, type MenuAction, type MenuSection } from './menu-action'

const buttons = (actions: MenuAction[]) =>
  actions.map((a) => (
    <Button
      key={a.key}
      label={a.label}
      systemImage={a.selected ? 'checkmark' : a.systemImage}
      role={a.destructive ? 'destructive' : undefined}
      onPress={a.onPress}
    />
  ))

const MenuButtons = ({ actions }: { actions: MenuAction[] | MenuSection[] }) => {
  const sections = menuSections(actions)
  if (sections.length === 1 && !sections[0]!.title) return buttons(sections[0]!.actions)
  return sections.map((s) => (
    <Section key={s.key} title={s.title}>
      {buttons(s.actions)}
    </Section>
  ))
}

export default MenuButtons
