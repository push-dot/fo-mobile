import { Stack } from 'expo-router'
import { View } from 'react-native'
import { ConsentPromptListener } from '@/features/chat'
import { FULL_SHEET_KIND } from '@/features/jobs'
import { fullSheetOptions, sheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

// A cold deep link to a modal such as /compose still gets the tabs underneath, so closing it has somewhere to go.
export const unstable_settings = { initialRouteName: '(tabs)' }

const SignedInStack = () => {
  const c = useColors()
  return (
    <View style={{ flex: 1 }}>
      <ConsentPromptListener />
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="postings/[id]" />
      <Stack.Screen name="profiles/[id]" />
      <Stack.Screen name="posts/[id]" />
      <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" />
      <Stack.Screen name="search" />
      <Stack.Screen name="offers/index" />
      <Stack.Screen name="offers/archived" />
      <Stack.Screen name="offers/[id]" />
      <Stack.Screen name="offers/[id]/messages" />
      <Stack.Screen name="settings/index" />
      <Stack.Screen name="settings/blocked" />
      <Stack.Screen name="settings/legal" />
      <Stack.Screen name="docs/[id]" />
      <Stack.Screen name="docs/push/index" />
      <Stack.Screen name="docs/push/[id]" />
      <Stack.Screen name="docs/push/[id]/rename" options={sheetOptions(c)} />
      <Stack.Screen name="activity/follows" />
      <Stack.Screen name="activity/posts" />
      <Stack.Screen name="activity/applications/[id]" />
      <Stack.Screen name="access-mode" options={sheetOptions(c)} />
      <Stack.Screen name="consent" options={sheetOptions(c)} />
      <Stack.Screen name="reconsent-terms" options={{ gestureEnabled: false }} />
      <Stack.Screen name="terms-view" />
      <Stack.Screen name="quick-start/[key]" options={sheetOptions(c)} />
      <Stack.Screen name="material-picker" options={sheetOptions(c)} />
      <Stack.Screen name="bots/[botId]/index" />
      <Stack.Screen name="bots/[botId]/profile" />
      <Stack.Screen name="bots/[botId]/companies" />
      <Stack.Screen name="bots/[botId]/color" options={sheetOptions(c)} />
      <Stack.Screen name="bots/new" options={{ presentation: 'modal' }} />
      <Stack.Screen name="bots/pick" options={sheetOptions(c)} />
      <Stack.Screen name="materials/index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="materials/[kind]/[id]" options={sheetOptions(c)} />
      <Stack.Screen name="materials/link-add" options={sheetOptions(c)} />
      <Stack.Screen name="account" options={{ presentation: 'modal' }} />
      <Stack.Screen name="plan" />
      <Stack.Screen name="plan-notice" />
      <Stack.Screen
        name="job-filter"
        options={({ route }) => ((route.params as { kind?: string } | undefined)?.kind === FULL_SHEET_KIND ? fullSheetOptions(c) : sheetOptions(c))}
      />
      <Stack.Screen name="apply" options={sheetOptions(c)} />
      <Stack.Screen name="hub-filter" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="proposal" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="activity/add-event" options={sheetOptions(c)} />
      <Stack.Screen name="activity/calendar" options={sheetOptions(c)} />
      <Stack.Screen name="settings/pick" options={sheetOptions(c)} />
      <Stack.Screen name="docs/[id]/to-profile" options={sheetOptions(c)} />
      <Stack.Screen name="docs/[id]/rename" options={sheetOptions(c)} />
      <Stack.Screen name="offers/[id]/reply" options={sheetOptions(c)} />
    </Stack>
    </View>
  )
}

export default SignedInStack
