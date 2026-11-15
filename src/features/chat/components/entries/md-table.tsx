import { View } from 'react-native'
import { Text } from '@/shared/components'
import { spacing, useColors } from '../../../../theme'
import type { TableBlock } from '../../utils/bot-text'
import Rich from './rich'

// A column's share follows its longest cell, so a tag column stays narrow and the text columns take the rest.
const SHARE = { min: 3, max: 24 }
const share = (cells: string[]) => Math.min(SHARE.max, Math.max(SHARE.min, ...cells.map((cell) => cell.length)))

/** A markdown table inside a bot bubble: header in grey, a hairline between rows, no fill of its own (rule 38). */
const MdTable = ({ table }: { table: TableBlock }) => {
  const c = useColors()
  const shares = table.head.map((_, col) => share([table.head[col]!, ...table.rows.map((row) => row[col] ?? '')]))
  const row = (cells: string[], head: boolean, key: string, last: boolean) => (
    <View
      key={key}
      style={{ flexDirection: 'row', gap: spacing[3], paddingVertical: spacing[2], borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}
    >
      {shares.map((flex, col) => (
        <View key={col} style={{ flex, minWidth: col === 0 ? 40 : 0 }}>
          {head ? (
            <Text v="c1" weight="700" color="t3">
              {cells[col]}
            </Text>
          ) : (
            <Rich v="b2" text={cells[col] ?? ''} />
          )}
        </View>
      ))}
    </View>
  )
  return (
    <View accessibilityRole="summary">
      {row(table.head, true, 'head', false)}
      {table.rows.map((cells, i) => row(cells, false, `row${i}`, i === table.rows.length - 1))}
    </View>
  )
}

export default MdTable
