import { View } from 'react-native'
import { Text } from '@/shared/components'
import { useColors } from '../../../../theme'
import type { TableBlock } from '../../utils/bot-text'
import { CELL, cellPadRight, tableColumns } from '../../utils/table-columns'
import Rich from './rich'

const MdTable = ({ table, width }: { table: TableBlock; width: number }) => {
  const c = useColors()
  const columns = tableColumns(table.head, table.rows, width)
  const row = (cells: string[], head: boolean, key: string, last: boolean) => (
    <View key={key} style={{ flexDirection: 'row', paddingVertical: CELL.padY, borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line }}>
      {columns.map((w, col) => (
        <View key={col} style={{ width: w, paddingRight: cellPadRight(col, columns.length) }}>
          {head ? (
            <Text v="c1" weight="600" color="t3" style={{ lineHeight: CELL.line }}>
              {cells[col]}
            </Text>
          ) : (
            <Rich v="b2" text={cells[col] ?? ''} style={{ fontSize: CELL.body, lineHeight: CELL.line }} />
          )}
        </View>
      ))}
    </View>
  )
  return (
    <View accessibilityRole="summary" style={{ width, marginVertical: 2 }}>
      {row(table.head, true, 'head', false)}
      {table.rows.map((cells, i) => row(cells, false, `row${i}`, i === table.rows.length - 1))}
    </View>
  )
}

export default MdTable
