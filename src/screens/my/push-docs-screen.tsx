import { monthDay } from '@push/shared'
import { router } from 'expo-router'
import { ActivityIndicator, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { FitRing, pushCardLines, PUSH_DOCS_TITLE, useDocuments, useMyApplications } from '@/features/my'
import { GlassButton, Text } from '@/shared/components'
import { useColors } from '@/theme'
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
      style={{ flexDirection: 'row', alignItems: 'center', gap: 16, borderRadius: 20, borderWidth: 1, borderColor: c.line, paddingVertical: 16, paddingLeft: 20, paddingRight: 16 }}
    >
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="h3" weight="800" numberOfLines={1}>
          {lines.title}
          {lines.company ? (
            <Text v="c1" weight="600" color="t2">
              {'  '}
              {lines.company}
            </Text>
          ) : null}
        </Text>
        {sub ? (
          <Text v="c1" color="t2" numberOfLines={1} style={{ marginTop: 4 }}>
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
      <View style={{ height: 56, flexDirection: 'row', alignItems: 'center', gap: 8, paddingHorizontal: 8 }}>
        <GlassButton actions={[{ icon: 'x', label: '닫기', onPress: () => router.back() }]} />
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, textAlign: 'center' }}>
          {PUSH_DOCS_TITLE}
        </Text>
        <View style={{ width: 44 }} />
      </View>
      {isLoading ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ gap: 12, paddingHorizontal: 20, paddingBottom: insets.bottom + 24 }}>
          <Text v="c1" weight="600" color="t2" style={{ paddingTop: 8, paddingBottom: 0 }}>
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
