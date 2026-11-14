import { View } from 'react-native'
import { Badge, Text } from '@/shared/components'
import { radius, spacing, useColors } from '../../../../theme'
import { isVerdictPlan } from '../../utils/stream-v3'
import type { PlanItem } from '../../types'

// The board's index chip is width 24 plus 2x7 padding.
const INDEX_CHIP = 38

/** The rows of a plan: header and keywords when it has a title, else the bare 고칠 점 rows. */
export const PlanRows = ({ item }: { item: PlanItem }) => {
  const titled = !!item.title
  const verdict = isVerdictPlan(item.rows)
  return (
    <>
      {titled ? (
        <View style={{ flexDirection: 'row', justifyContent: 'space-between' }}>
          <Text v="c1" weight="700" color="t3">
            {item.title}
          </Text>
          <Text v="c1" weight="700" color="t3">
            {item.meta}
          </Text>
        </View>
      ) : null}
      {item.rows.map((r, i) => (
        <View key={r.label} style={{ flexDirection: 'row', gap: spacing[3], alignItems: 'flex-start' }}>
          {verdict ? <Badge label={String(i + 1)} minWidth={INDEX_CHIP} /> : <Badge label={r.tag} tone={r.tone} minWidth={titled ? 52 : 58} />}
          <View style={{ flex: 1, minWidth: 0 }}>
            <Text v="b2" weight="700">
              {r.label}
            </Text>
            <Text v="c1" color="t3">
              {r.note}
            </Text>
          </View>
          {verdict ? <Badge label={r.tag} tone={r.tone} /> : null}
        </View>
      ))}
      {titled && item.keywords.length ? (
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
          {item.keywords.map((k) => (
            <Badge key={k} label={`+ ${k}`} tone="ac" />
          ))}
        </View>
      ) : null}
    </>
  )
}

/** The plan inside a bot bubble (.bubblecard): 14 between rows, 16 around, the card radius, bg2. */
export const BubbleCard = ({ item }: { item: PlanItem }) => {
  const c = useColors()
  return (
    <View style={{ gap: 14, padding: spacing[4], borderRadius: radius.card, backgroundColor: c.bg2 }}>
      <PlanRows item={item} />
    </View>
  )
}
