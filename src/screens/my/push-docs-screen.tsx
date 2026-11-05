import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FitRing, ListSkeleton, pushCardLines, PUSH_DOCS_TITLE, useDocuments, useMyApplications } from '@/features/my'
import { GlassButton, Text } from '@/shared/components'
import { radius, spacing, useColors } from '@/theme'
import type { HubDocument } from '@/features/my'

const Line = ({ doc }: { doc: HubDocument }) => {
  const c = useColors()
  const apps = useMyApplications()
  const application = apps.data?.data.find((a) => a.id === doc.applicationId) ?? null
  const lines = pushCardLines(doc, application)
  const sub = [lines.doc, monthDay(doc.updatedAt)].filter(Boolean).join(' · ')
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[lines.company, lines.title, lines.score && `적합도 10점 만점에 ${lines.score}점`, lines.doc, monthDay(doc.updatedAt)].filter(Boolean).join(', ')}
      onPress={() => router.push(`/docs/push/${doc.id}`)}
      style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[4], borderRadius: radius.card, borderWidth: 1, borderColor: c.line, paddingVertical: spacing[4], paddingLeft: spacing[5], paddingRight: spacing[4] }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <View style={{ flexDirection: 'row', alignItems: 'baseline', gap: 6 }}>
          <Text v="h3" weight="800" numberOfLines={1} style={{ flexShrink: 1 }}>
            {lines.title}
          </Text>
          {lines.company ? (
            <Text v="c1" weight="600" color="t2" numberOfLines={1}>
              {lines.company}
            </Text>
          ) : null}
        </View>
        {sub ? (
          <Text v="c1" color="t2" numberOfLines={1} style={{ marginTop: spacing[1] }}>
            {sub}
          </Text>
        ) : null}
      </View>
      {lines.score ? <FitRing score={lines.score} /> : null}
    </Pressable>
  )
}

const PushDocsScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const { data, isLoading } = useDocuments()
  const docs = data?.data ?? []
  return (
    <View style={{ flex: 1, backgroundColor: c.bg, paddingTop: insets.top }}>
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[2] }}>
        <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {PUSH_DOCS_TITLE}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      {isLoading ? (
        <ListSkeleton />
      ) : (
        <ScrollView contentContainerStyle={{ gap: spacing[3], paddingHorizontal: spacing[5], paddingBottom: insets.bottom + spacing[6] }}>
          <Text v="c1" weight="600" color="t2" style={{ paddingTop: spacing[2] }}>
            {data?.page.total ?? docs.length}개
          </Text>
          {docs.map((doc) => (
            <Line key={doc.id} doc={doc} />
          ))}
        </ScrollView>
      )}
    </View>
  )
}

export default PushDocsScreen
