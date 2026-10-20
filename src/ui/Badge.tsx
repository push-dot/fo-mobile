import { View } from 'react-native'
import { radius, useColors } from '../theme'
import { Text } from './Text'

export type BadgeTone = 'ac' | 'grey' | 'red' | 'green' | 'orange'

/** 22px status label; one or two words, at most two per row. */
export function Badge({ label, tone = 'grey' }: { label: string; tone?: BadgeTone }) {
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
    <View style={{ height: 22, paddingHorizontal: 7, borderRadius: radius.xs, backgroundColor: bg, justifyContent: 'center', alignSelf: 'flex-start' }}>
      <Text v="c2" weight="700" style={{ color: fg }} numberOfLines={1}>
        {label}
      </Text>
    </View>
  )
}
