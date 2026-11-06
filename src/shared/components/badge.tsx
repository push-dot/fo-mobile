import { View } from 'react-native'
import { radius, useColors } from '../../theme'
import Text from './text'

export type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

const Badge = ({ label, tone = 'grey', minWidth }: { label: string; tone?: BadgeTone; minWidth?: number }) => {
  const c = useColors()
  const map = {
    ac: [c.acSoft, c.acText],
    grey: [c.fill, c.t2],
    red: [c.redSoft, c.red],
    green: [c.greenSoft, c.green],
    orange: [c.orangeSoft, c.orange],
  } as const
  const [bg, fg] = map[tone]
  return (
    <View style={{ minWidth, minHeight: 22, paddingHorizontal: 7, borderRadius: radius.xs, backgroundColor: bg, alignItems: 'center', justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text v="c2" weight="700" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}

export default Badge
