import { Platform, View } from 'react-native'
import Glass from './glass'
import GlassActionButton, { type GlassAction } from './glass-action'

export type { GlassAction }

const GlassButton = ({ actions }: { actions: GlassAction[] }) => {
  const single = actions.length === 1
  const row = (
    <View style={{ flexDirection: 'row', alignItems: 'center', paddingHorizontal: single ? 0 : 4 }}>
      {actions.map((a) => (
        <GlassActionButton key={a.label} a={a} width={single ? 44 : 40} />
      ))}
    </View>
  )
  if (Platform.OS === 'android') return row
  return (
    <Glass interactive style={{ borderRadius: 22, minWidth: 44, height: 44, justifyContent: 'center' }}>
      {row}
    </Glass>
  )
}

export default GlassButton
