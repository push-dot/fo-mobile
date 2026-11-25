import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Text } from '@/shared/components'
import type { TableBlock } from '../../utils/bot-text'
import { CELL, cellPadRight, tableColumns } from '../../utils/table-columns'
import Rich from './rich'

const MdTable = ({ table, width }: { table: TableBlock; width: number }) => {
  const columns = tableColumns(table.head, table.rows, width)
  const row = (cells: string[], head: boolean, key: string, last: boolean) => (
    <View key={key} style={[styles.row, last && styles.rowLast]}>
      {columns.map((w, col) => (
        <View key={col} style={styles.cell(w, cellPadRight(col, columns.length))}>
          {head ? (
            <Text v="c1" weight="600" color="t3" style={styles.head}>
              {cells[col]}
            </Text>
          ) : (
            <Rich v="b2" text={cells[col] ?? ''} style={styles.body} />
          )}
        </View>
      ))}
    </View>
  )
  return (
    <View accessibilityRole="summary" style={styles.table(width)}>
      {row(table.head, true, 'head', false)}
      {table.rows.map((cells, i) => row(cells, false, `row${i}`, i === table.rows.length - 1))}
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  row: { flexDirection: 'row', paddingVertical: CELL.padY, borderBottomWidth: 1, borderBottomColor: theme.colors.line },
  rowLast: { borderBottomWidth: 0 },
  cell: (width: number, paddingRight: number) => ({ width, paddingRight }),
  head: { lineHeight: CELL.line },
  body: { fontSize: CELL.body, lineHeight: CELL.line },
  table: (width: number) => ({ width, marginVertical: 2 }),
}))

export default MdTable
