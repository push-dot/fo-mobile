import { QueryClientProvider } from '@tanstack/react-query'
import { DarkTheme, DefaultTheme, Stack, ThemeProvider } from 'expo-router'
import { useEffect } from 'react'
import { queryClient } from '@/providers'
import { useSession } from '@/shared/infrastructure'
import { useThemeMode, useThemePreference } from '@/theme'

const RootLayout = () => {
  const mode = useThemeMode()
  const { ready, session, load } = useSession()
  const themeReady = useThemePreference((s) => s.ready)
  const loadTheme = useThemePreference((s) => s.load)

  useEffect(() => {
    void load()
    void loadTheme()
  }, [load, loadTheme])

  if (!ready || !themeReady) return null

  return (
    <ThemeProvider value={mode === 'dark' ? DarkTheme : DefaultTheme}>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!!session}>
            <Stack.Screen name="(tabs)" />
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
            <Stack.Screen name="docs/push/index" />
            <Stack.Screen name="docs/push/[id]" />
            <Stack.Screen name="activity/follows" />
            <Stack.Screen name="activity/posts" />
            <Stack.Screen name="activity/applications/[id]" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="phone" />
            <Stack.Screen name="verify-phone" />
            <Stack.Screen name="signup-terms" />
            <Stack.Screen name="phone-registered" />
          </Stack.Protected>
        </Stack>
      </QueryClientProvider>
    </ThemeProvider>
  )
}

export default RootLayout
