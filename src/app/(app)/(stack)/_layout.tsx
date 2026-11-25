import { Stack } from 'expo-router'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { ConsentPromptListener } from '@/features/chat'
import { nativeHeaderOptions } from '@/shared/components'
import { fullPageOptions, modalOptions, sheetOptions, tintedSheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

export const unstable_settings = { anchor: '(tabs)' }

const isInstant = (params: unknown): boolean => {
  const p = params as { instant?: string; params?: unknown } | undefined
  return !!p && (!!p.instant || isInstant(p.params))
}
const instantNone = ({ route }: { route: { params?: unknown } }) => ({ animation: isInstant(route.params) ? ('none' as const) : ('default' as const) })

const SignedInStack = () => {
  const c = useColors()
  const bar = nativeHeaderOptions(c)
  const clearBar = nativeHeaderOptions(c, true)
  return (
    <View style={styles.root}>
      <ConsentPromptListener />
      <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="(tabs)" options={{ animation: 'none' }} />
      <Stack.Screen name="postings/[id]" options={clearBar} />
      <Stack.Screen name="profiles/[id]" options={clearBar} />
      <Stack.Screen name="posts/[id]" options={bar} />
      <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
      <Stack.Screen name="notifications" options={clearBar} />
      <Stack.Screen name="search" options={{ animation: 'fade' }} />
      <Stack.Screen name="offers/index" options={bar} />
      <Stack.Screen name="offers/archived" options={bar} />
      <Stack.Screen name="offers/[id]" options={bar} />
      <Stack.Screen name="offers/[id]/messages" options={bar} />
      <Stack.Screen name="settings/index" options={bar} />
      <Stack.Screen name="settings/blocked" options={bar} />
      <Stack.Screen name="settings/career" options={bar} />
      <Stack.Screen name="settings/legal" options={bar} />
      <Stack.Screen name="docs/[id]" options={clearBar} />
      <Stack.Screen name="docs/push/index" options={bar} />
      <Stack.Screen name="docs/push/[id]" options={bar} />
      <Stack.Screen name="docs/push/[id]/rename" options={sheetOptions(c)} />
      <Stack.Screen name="edit-profile/[section]" options={modalOptions(c)} />
      <Stack.Screen name="activity/follows" options={bar} />
      <Stack.Screen name="activity/posts" options={bar} />
      <Stack.Screen name="activity/applications/[id]" options={bar} />
      <Stack.Screen name="choice" options={sheetOptions(c)} />
      <Stack.Screen name="consent" options={sheetOptions(c)} />
      <Stack.Screen name="reconsent-terms" options={{ gestureEnabled: false }} />
      <Stack.Screen name="terms-view" options={fullPageOptions()} />
      <Stack.Screen name="quick-start/[key]" options={sheetOptions(c)} />
      <Stack.Screen name="quick-start/[key]/all" options={modalOptions(c)} />
      <Stack.Screen name="material-picker" options={modalOptions(c)} />
      <Stack.Screen name="review" options={modalOptions(c)} />
      <Stack.Screen name="bots/[botId]/index" options={instantNone} />
      <Stack.Screen name="bots/[botId]/profile" />
      <Stack.Screen name="bots/[botId]/companies" />
      <Stack.Screen name="bots/[botId]/color" options={sheetOptions(c)} />
      <Stack.Screen name="bots/[botId]/allowed" options={sheetOptions(c)} />
      <Stack.Screen name="bots/new" options={modalOptions(c)} />
      <Stack.Screen name="materials/index" options={modalOptions(c)} />
      <Stack.Screen name="materials/[kind]/[id]" options={sheetOptions(c)} />
      <Stack.Screen name="materials/link-add" options={sheetOptions(c)} />
      <Stack.Screen name="materials/pick" options={sheetOptions(c)} />
      <Stack.Screen name="materials/create-pick" options={sheetOptions(c)} />
      <Stack.Screen name="account" options={modalOptions(c)} />
      <Stack.Screen name="plan" options={fullPageOptions()} />
      <Stack.Screen name="usage" options={fullPageOptions()} />
      <Stack.Screen name="job-filter" options={tintedSheetOptions(c)} />
      <Stack.Screen name="apply" options={sheetOptions(c)} />
      <Stack.Screen name="hub-filter" options={tintedSheetOptions(c)} />
      <Stack.Screen name="proposal" options={sheetOptions(c, 'fitToContents')} />
      <Stack.Screen name="activity/add-event" options={sheetOptions(c)} />
      <Stack.Screen name="activity/calendar" options={sheetOptions(c)} />
      <Stack.Screen name="settings/pick" options={sheetOptions(c)} />
      <Stack.Screen name="docs/[id]/to-profile" options={{ ...sheetOptions(c), contentStyle: { backgroundColor: c.bg } }} />
      <Stack.Screen name="docs/[id]/rename" options={sheetOptions(c)} />
      <Stack.Screen name="offers/[id]/reply" options={sheetOptions(c)} />
    </Stack>
    </View>
  )
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1 },
}))

export default SignedInStack
