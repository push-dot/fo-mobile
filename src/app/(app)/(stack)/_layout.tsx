import { Stack } from 'expo-router'
import { Platform } from 'react-native'
import { FULL_SHEET_KIND } from '@/features/jobs'
import { fullSheetOptions, sheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

// A cold deep link to a modal such as /compose still gets the tabs underneath, so closing it has somewhere to go.
export const unstable_settings = { initialRouteName: '(tabs)' }

const SignedInStack = () => {
  const c = useColors()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" />
      <Stack.Screen name="chat/[id]" />
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
      <Stack.Screen name="settings/visibility" />
      <Stack.Screen name="settings/blocked" />
      <Stack.Screen name="settings/legal" />
      <Stack.Screen name="docs/[id]" />
      <Stack.Screen name="docs/push/index" options={{ presentation: 'modal' }} />
      <Stack.Screen name="docs/push/[id]" />
      <Stack.Screen name="docs/push/[id]/rename" options={sheetOptions(c)} />
      <Stack.Screen name="activity/follows" />
      <Stack.Screen name="activity/posts" />
      <Stack.Screen name="activity/applications/[id]" />
      <Stack.Screen name="sidebar/index" options={{ animation: 'slide_from_left' }} />
      <Stack.Screen name="sidebar/account" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sidebar/docs" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sidebar/links" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sidebar/bookmarks" options={{ presentation: 'modal' }} />
      <Stack.Screen name="sidebar/conversations" options={{ presentation: 'modal', animation: Platform.OS === 'android' ? 'slide_from_bottom' : 'default' }} />
      <Stack.Screen name="sidebar/link-add" options={sheetOptions(c)} />
      <Stack.Screen name="sidebar/rename/[id]" options={sheetOptions(c)} />
      <Stack.Screen name="access-mode" options={sheetOptions(c)} />
      <Stack.Screen name="consent" options={sheetOptions(c)} />
      <Stack.Screen name="reconsent-terms" options={{ gestureEnabled: false }} />
      <Stack.Screen name="terms-view" />
      <Stack.Screen name="quick-start/[key]" options={sheetOptions(c)} />
      <Stack.Screen name="materials" options={sheetOptions(c)} />
      <Stack.Screen
        name="job-filter"
        options={({ route }) => ((route.params as { kind?: string } | undefined)?.kind === FULL_SHEET_KIND ? fullSheetOptions(c) : sheetOptions(c))}
      />
      <Stack.Screen name="apply" options={sheetOptions(c)} />
      <Stack.Screen name="hub-filter" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="proposal" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="confirm" options={sheetOptions(c)} />
      <Stack.Screen name="activity/add-event" options={sheetOptions(c)} />
      <Stack.Screen name="settings/pick" options={sheetOptions(c)} />
      <Stack.Screen name="docs/import" options={sheetOptions(c)} />
      <Stack.Screen name="docs/[id]/to-profile" options={sheetOptions(c)} />
      <Stack.Screen name="docs/[id]/more" options={sheetOptions(c)} />
      <Stack.Screen name="offers/[id]/reply" options={sheetOptions(c)} />
    </Stack>
  )
}

export default SignedInStack
