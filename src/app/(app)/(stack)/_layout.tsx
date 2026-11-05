import { Stack } from 'expo-router'
import { LONG_FILTER_KINDS, type FilterKey } from '@/features/jobs'
import { sheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

const SignedInStack = () => {
  const c = useColors()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
      <Stack.Screen name="postings/[id]" />
      <Stack.Screen name="profiles/[id]" />
      <Stack.Screen name="posts/[id]" />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search" />
      <Stack.Screen name="offers/index" />
      <Stack.Screen name="offers/[id]" />
      <Stack.Screen name="offers/[id]/messages" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/visibility" />
      <Stack.Screen name="docs/[id]" />
      <Stack.Screen name="docs/push/index" options={{ presentation: 'fullScreenModal' }} />
      <Stack.Screen name="docs/push/[id]" />
      <Stack.Screen name="activity/follows" />
      <Stack.Screen name="activity/posts" />
      <Stack.Screen name="activity/applications/[id]" />
      <Stack.Screen name="access-mode" options={sheetOptions(c)} />
      <Stack.Screen name="consent" options={sheetOptions(c)} />
      <Stack.Screen name="quick-start/[key]" options={sheetOptions(c, [0.5, 1])} />
      <Stack.Screen name="materials" options={sheetOptions(c)} />
      <Stack.Screen
        name="job-filter"
        options={({ route }) =>
          sheetOptions(
            c,
            LONG_FILTER_KINDS.includes((route.params as { kind?: FilterKey })?.kind as FilterKey)
              ? [0.5, 1]
              : 'fitToContents',
          )
        }
      />
      <Stack.Screen name="apply" options={sheetOptions(c, [0.5, 1])} />
      <Stack.Screen name="hub-filter" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="proposal" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="confirm" options={sheetOptions(c)} />
      <Stack.Screen name="activity/add-event" options={sheetOptions(c)} />
    </Stack>
  )
}

export default SignedInStack
