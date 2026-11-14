import { router } from 'expo-router'
import { ScrollView, useWindowDimensions, View } from 'react-native'
import { useShareFile, useStartChat } from '@/features/chat'
import {
  FIX_DOC,
  PREVIEW_HEADINGS,
  useResumeDraft,
  useFileMenu,
  useSource,
  useUndoRemove,
  type ResumeDraft,
} from '@/features/my'
import { CtaBar, Badge, Button, GlassButton, Skeleton, Text, TopBar } from '@/shared/components'
import { palette, radius, spacing, useColors } from '@/theme'

const PAGE_PAD = 36
const TITLE_MAX_WIDTH = 168
const CAREER_BARS = [92, 70]
const PROJECT_BARS = [88, 76, 82, 60]

const sheet = palette.light
// CoreText lays the 12pt intro 0.23pt wider than the board's WebKit (290.23 in a 290pt column), which drops its last word to a third line.
const LINE_OVERHANG = { marginRight: -1 }
const PAPER_SHADOW = '0 0 0 1px rgba(0, 0, 0, 0.06), 0 6px 20px rgba(0, 0, 0, 0.1)'

const Bars = ({ widths }: { widths: readonly number[] }) =>
  widths.map((w) => (
    <View key={w} style={{ width: `${w}%`, height: 5, borderRadius: 3, backgroundColor: sheet.deco, opacity: 0.55 }} />
  ))

const Paper = ({ d }: { d: ResumeDraft }) => {
  const { width } = useWindowDimensions()
  const p = d.profile
  const head = (t: string) => (
    <Text
      v="tab"
      weight="800"
      style={{ color: sheet.acText, lineHeight: 17, borderBottomWidth: 1, borderBottomColor: sheet.line, paddingBottom: spacing[1], marginTop: spacing[1] }}
    >
      {t}
    </Text>
  )
  return (
    <View
      accessibilityLabel={`${p.displayName} 서류 미리보기`}
      style={{
        width: '100%',
        // DocViewer board: WebKit resolves `aspect-ratio: 1 / 1.414` against the 402pt screen width (card 330 x 568), not the 330pt card.
        minHeight: width * 1.414,
        backgroundColor: sheet.paper,
        borderRadius: radius.xs,
        paddingVertical: spacing[6],
        paddingHorizontal: spacing[5],
        gap: spacing[2],
        // The board draws the hairline as a 0 0 0 1px shadow, which takes no layout: the text column is 290pt (a 1pt border made it 288 and dropped "왔어요." to a third line).
        boxShadow: PAPER_SHADOW,
      }}
    >
      <Text v="h3" weight="800" style={{ color: sheet.t1, lineHeight: 25 }}>
        {p.displayName}
      </Text>
      <Text v="tab" weight="400" style={{ color: sheet.t3, lineHeight: 16 }}>
        {[d.email, ...d.links].filter(Boolean).join(' · ')}
      </Text>
      <Text v="c2" style={{ color: sheet.t2, lineHeight: 17, ...LINE_OVERHANG }}>
        {p.intro}
      </Text>
      {head(PREVIEW_HEADINGS[0])}
      {p.careers.map((cr, i) => (
        <View key={`${cr.company}-${cr.startedOn}`} style={{ gap: spacing[2], marginTop: i ? 2 : 0 }}>
          <Text v="c2" weight="700" style={{ color: sheet.t1, lineHeight: 18 }}>
            {cr.company} · {cr.role}{' '}
            <Text v="c2" weight="500" style={{ color: sheet.t3 }}>
              {cr.startedOn.replace('-', '.')} – {cr.endedOn?.replace('-', '.') ?? '현재'}
            </Text>
          </Text>
          {cr.description ? (
            <Text v="tab" weight="400" style={{ color: sheet.t2, lineHeight: 16, ...LINE_OVERHANG }}>
              {cr.description
                .split('\n')
                .filter(Boolean)
                .map((line) => `· ${line}`)
                .join('\n')}
            </Text>
          ) : (
            <Bars widths={CAREER_BARS} />
          )}
        </View>
      ))}
      {head(PREVIEW_HEADINGS[1])}
      {d.projects?.length ? (
        d.projects.map((project) => (
          <Text key={project} v="tab" weight="400" style={{ color: sheet.t2, lineHeight: 16 }}>
            {project}
          </Text>
        ))
      ) : (
        <Bars widths={PROJECT_BARS} />
      )}
      {head(PREVIEW_HEADINGS[2])}
      <Text v="tab" weight="400" style={{ color: sheet.t2, lineHeight: 17 }}>
        {p.skills.join(' · ')}
      </Text>
    </View>
  )
}

const DocViewerScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const start = useStartChat()
  const doc = useSource(id)
  const share = useShareFile()
  const draft = useResumeDraft(id)
  useUndoRemove(() => router.back())
  const s = doc.data
  const openMenu = useFileMenu(s)
  const d = draft.data

  return (
    <View style={{ flex: 1, backgroundColor: c.bg2 }}>
      <TopBar
        left={
          <Text v="h3" numberOfLines={1} accessibilityRole="header" style={{ alignSelf: 'center', maxWidth: TITLE_MAX_WIDTH }}>
            {s?.fileName ?? '서류 보기'}
          </Text>
        }
        onBack={() => router.back()}
        right={
          <GlassButton
            actions={[
              { icon: 'share', label: '공유', onPress: () => (s ? share.mutate({ sourceId: id, name: s.fileName, mimeType: s.mimeType }) : doc.isError && share.mutate({ documentId: id })) },
              { icon: 'menu', label: '더 보기', onPress: openMenu },
            ]}
          />
        }
      />
      <ScrollView contentContainerStyle={{ paddingBottom: 120 }}>
        <View style={{ flexDirection: 'row', justifyContent: 'flex-end', paddingVertical: spacing[1], paddingHorizontal: spacing[5] }}>
          {d?.pageCount ? <Badge label={`1 / ${d.pageCount}`} tone="grey" /> : null}
        </View>
        <View style={{ paddingTop: spacing[1], paddingHorizontal: PAGE_PAD }}>
          {d ? (
            <Paper d={d} />
          ) : draft.isPending ? (
            <Skeleton width="100%" height={420} radius={radius.xs} />
          ) : (
            <Text v="b2" color="t3" style={{ marginTop: 60, textAlign: 'center' }}>
              미리보기는 곧 볼 수 있어요
            </Text>
          )}
        </View>
      </ScrollView>
      <CtaBar>
        <Button
          label="Bot한테 보내기"
          variant="secondary"
          onPress={() => void start(FIX_DOC, FIX_DOC, s?.fileName, undefined, undefined, { evidenceIds: [id] })}
        />
        <Button label="내 프로필로 전환" disabled={!d} onPress={() => router.push(`/docs/${id}/to-profile`)} style={{ flex: 1 }} />
      </CtaBar>
    </View>
  )
}

export default DocViewerScreen
