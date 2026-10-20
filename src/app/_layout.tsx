import { QueryClient, QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { useEffect } from 'react'
import { useColorScheme } from 'react-native'
import { useSession } from '../lib/session'

const queryClient = new QueryClient({ defaultOptions: { queries: { staleTime: 30_000 } } })

export default function RootLayout() {
  const scheme = useColorScheme()
  const { ready, session, load } = useSession()

  useEffect(() => {
    void load()
  }, [load])

  if (!ready) return null

  return (
    // ThemeProvider sets a non-white background so NativeTabs don't flash white on iOS 26.
    <ThemeProvider value={scheme === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
            {/* Screens drawn without a tab bar live outside (tabs): hiding the Android tab bar
                leaves its area untouchable, and the boards show none here (feature-spec 15). */}
            <Stack.Screen name="chat/[id]" />
            <Stack.Screen name="postings/[id]" />
            <Stack.Screen name="profiles/[id]" />
            <Stack.Screen name="posts/[id]" />
            <Stack.Screen name="notifications" />
            <Stack.Screen name="search" />
            <Stack.Screen name="offers/index" />
            <Stack.Screen name="offers/[id]" />
            <Stack.Screen name="settings/index" />
            <Stack.Screen name="settings/visibility" />
            <Stack.Screen name="docs/[id]" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  )
}
