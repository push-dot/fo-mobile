import { Platform, View } from 'react-native'
import { radius, spacing } from '../../theme'
import Glass from './glass'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

const GlassButton = ({ actions }: { actions: GlassAction[] }) => {
  const single = actions.length === 1
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : spacing[1] }}>
      {actions.map((a) => (
        <GlassActionButton key={a.label} a={a} width={single ? 44 : 40} />
      ))}
    </View>
  )
  if (Platform.OS === 'android') return row
  return (
    <Glass interactive style={{ borderRadius: radius.pill, minWidth: 44, height: 44, justifyContent: 'center' }}>
      {row}
    </Glass>
  )
}

export default GlassButton
