import { Platform, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Glass from './glass'
import { useXlChrome } from './xl-chrome'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

const GlassButton = ({ actions, filled, iconSize, circle }: { actions: GlassAction[]; filled?: boolean; iconSize?: number; circle?: boolean }) => {
  const single = actions.length === 1
  const solid = filled || (circle && Platform.OS === 'android')
  const { button } = useXlChrome()
  const row = (
    <View style={[styles.row, single && styles.rowSingle]}>
      {actions.map((a) => (
        <GlassActionButton key={a.icon} a={a} width={single ? button : 40} iconSize={iconSize ?? (filled ? 16 : 22)} filled={solid} />
      ))}
    </View>
  )
  if (solid || Platform.OS === 'android') return row
  return (
    <Glass interactive style={styles.shape(button)}>
      {row}
    </Glass>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', alignItems: 'center', paddingHorizontal: theme.spacing[1] },
  rowSingle: { paddingHorizontal: 0 },
  shape: (button: number) => ({ borderRadius: theme.radius.pill, minWidth: button, height: button, justifyContent: 'center' }),
}))

export default GlassButton
