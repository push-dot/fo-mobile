import type { ReactNode } from 'react'
import { StyleSheet, View, useWindowDimensions } from 'react-native'
import { legalEffectiveLabel, type LegalBlock, type LegalDocument as Document } from '@push/shared'
import { Text } from '@/shared/components'
import { radius, spacing, type, useColors } from '@/theme'

const TITLE_GAP = 6
const TITLE_SIZE = { fontSize: 24, lineHeight: 32 }
const BODY_LINE = { lineHeight: type.b1.lineHeight }
const MARKER_WIDTH = 24
const ROW_PADDING = 14

const Body = ({ children, flex }: { children: ReactNode; flex?: boolean }) => (
  <Text v="b2" color="t2" style={[BODY_LINE, flex ? { flex: 1 } : null]}>
    {children}
  </Text>
)

const Block = ({ block }: { block: LegalBlock }) => {
  const c = useColors()
  // "12." must stay on one line at large text sizes, so the marker grows with the font.
  const markerWidth = Math.ceil(MARKER_WIDTH * useWindowDimensions().fontScale)
  if (block.kind === 'paragraph') return <Body>{block.text}</Body>
  if (block.kind === 'list')
    return (
      <View style={{ gap: spacing[2] }}>
        {block.items.map((item, index) => (
          <View key={index} style={{ flexDirection: 'row' }}>
            <Text v="b2" color="t2" style={[BODY_LINE, { width: markerWidth }]}>
              {block.ordered ? `${index + 1}.` : '•'}
            </Text>
            <Body flex>{item}</Body>
          </View>
        ))}
      </View>
    )
  const labels = block.columns.slice(1)
  return (
    <View style={{ borderRadius: radius.md, backgroundColor: c.bg2, paddingHorizontal: spacing[4] }}>
      {block.rows.map((row, index) => (
        <View
          key={index}
          accessible
          style={{ paddingVertical: ROW_PADDING, gap: spacing[1], borderTopWidth: index ? StyleSheet.hairlineWidth : 0, borderTopColor: c.line }}
        >
          <Text v="c1" weight="600">
            {row[0]}
          </Text>
          {row.slice(1).map((value, column) => (
            <Text key={column} v="c1" color="t2">
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
    <View style={{ gap: TITLE_GAP }}>
      <Text accessibilityRole="header" v="h1" style={TITLE_SIZE}>
        {document.title}
      </Text>
      <Text v="c1" color="t3">
        {legalEffectiveLabel(document)}
      </Text>
    </View>
    {document.intro.map((block, index) => (
      <Block key={index} block={block} />
    ))}
    {document.articles.map((article) => (
      <View key={article.heading} style={{ gap: spacing[3] }}>
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

export default LegalDocument
