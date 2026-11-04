import { router } from 'expo-router'
import { ActivityIndicator, ScrollView, View } from 'react-native'
import { monthDay } from '@push/shared'
import { Button, Text, TopBar } from '@/shared/components'
import { INTERVIEW_PREP, stageFlow, useMyApplications } from '@/features/my'
import { useColors } from '@/theme'

const ApplicationDetailScreen = ({ id }: { id: string }) => {
  const c = useColors()
  const { data, isLoading } = useMyApplications()
  const item = data?.data.find((a) => a.id === id)
  const flow = stageFlow(item?.stage ?? 'APPLIED')
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar title="지원 현황" onBack={() => router.back()} />
      {isLoading || !item ? (
        <ActivityIndicator style={{ marginTop: 40 }} />
      ) : (
        <ScrollView contentContainerStyle={{ padding: 20, gap: 16 }}>
          <Text v="c1" color="t3">
            {item.company}
          </Text>
          <Text v="h2">{item.title}</Text>
          <Text v="c1" color="t3">
            {monthDay(item.appliedAt ?? item.createdAt)}
          </Text>
          <Text v="h3">{flow.headline}</Text>
          <View style={{ flexDirection: 'row', gap: 8 }}>
            {flow.labels.map((label, index) => (
              <Text key={label} v="c1" weight={index <= flow.step ? '700' : '400'} color={index <= flow.step ? 'acText' : 't3'}>
                {label}
              </Text>
            ))}
          </View>
          <Button label={INTERVIEW_PREP} onPress={() => router.push('/(tabs)/(chat)/chat')} />
          <Button label="공고 보기" variant="secondary" onPress={() => router.push(`/postings/${item.jobId}`)} />
        </ScrollView>
      )}
    </View>
  )
}

export default ApplicationDetailScreen
