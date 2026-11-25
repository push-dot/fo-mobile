import type { ReactNode } from 'react'
import { View, useWindowDimensions } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { LEGAL_OPERATOR, legalEffectiveLabel, type LegalBlock, type LegalDocument as Document } from '@push/shared'
import { Text } from '@/shared/components'
import { type } from '@/theme'

const TITLE_GAP = 6
const TITLE_SIZE = { fontSize: 24, lineHeight: 32 }
const BODY_LINE = { lineHeight: type.b1.lineHeight }
const MARKER_WIDTH = 28
const MARKER_GAP = 13
const MARKER_OVERHANG = 20
const ROW_PADDING = 14
const LIST_GAP = 10
const CARD_LINE = { lineHeight: 21 }

const Body = ({ children, flex }: { children: ReactNode; flex?: boolean }) => (
  <Text v="b2" color="t2" style={[BODY_LINE, flex ? styles.flex : null]}>
    {children}
  </Text>
)

const Block = ({ block }: { block: LegalBlock }) => {
  const markerWidth = Math.ceil(MARKER_WIDTH * useWindowDimensions().fontScale)
  if (block.kind === 'paragraph') return <Body>{block.text}</Body>
  if (block.kind === 'list')
    return (
      <View style={styles.list}>
        {block.items.map((item, index) => (
          <View key={index} style={styles.item}>
            <Text v="b2" color="t2" style={[BODY_LINE, styles.marker(markerWidth)]}>
              {block.ordered ? `${index + 1}.` : '•'}
            </Text>
            <Body flex>{item}</Body>
          </View>
        ))}
      </View>
    )
  const labels = block.columns.slice(1)
  return (
    <View style={styles.card}>
      {block.rows.map((row, index) => (
        <View
          key={index}
          accessible
          style={[styles.row, index ? styles.rowDivider : null]}
        >
          <Text v="b2" weight="600">
            {row[0]}
          </Text>
          {row.slice(1).map((value, column) => (
            <Text key={column} v="c1" color="t2" style={CARD_LINE}>
              {labels.length > 1 ? `${labels[column]}: ${value}` : value}
            </Text>
          ))}
        </View>
      ))}
    </View>
  )
}

const LegalDocument = ({ document }: { document: Document }) => (
  <>
    <View style={styles.heading}>
      <Text accessibilityRole="header" v="h1" style={TITLE_SIZE}>
        {document.title}
      </Text>
      <Text v="c1" color="t3">
        {(document.key === 'termsOfService' || document.key === 'privacyPolicy') && LEGAL_OPERATOR.kind === 'individual'
          ? `${legalEffectiveLabel(document)} · 운영자 ${LEGAL_OPERATOR.displayName}`
          : legalEffectiveLabel(document)}
      </Text>
    </View>
    {document.intro.map((block, index) => (
      <Block key={index} block={block} />
    ))}
    {document.articles.map((article) => (
      <View key={article.heading} style={styles.article}>
        <Text v="h3" accessibilityRole="header">
          {article.heading}
        </Text>
        {article.blocks.map((block, index) => (
          <Block key={index} block={block} />
        ))}
      </View>
    ))}
  </>
)

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  list: { gap: LIST_GAP },
  item: { flexDirection: 'row' },
  marker: (markerWidth: number) => ({ width: markerWidth + MARKER_OVERHANG, marginLeft: -MARKER_OVERHANG, paddingRight: MARKER_GAP, textAlign: 'right' }),
  card: { borderRadius: theme.radius.md, backgroundColor: theme.colors.bg2, paddingHorizontal: theme.spacing[4], paddingVertical: theme.spacing[1] },
  row: { paddingVertical: ROW_PADDING, gap: theme.spacing[1], borderTopWidth: 0, borderTopColor: theme.colors.line },
  rowDivider: { borderTopWidth: StyleSheet.hairlineWidth },
  heading: { gap: TITLE_GAP },
  article: { gap: theme.spacing[2] },
}))

export default LegalDocument
