import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import { useEffect } from 'react'
import { Appearance } from 'react-native'
import { queryClient } from '@/providers'
import { ToastHost } from '@/shared/components'
import { useSession } from '@/shared/infrastructure'
import { useThemePreference } from '@/theme'
import { useDesignFonts } from '@/theme/fonts-loader'
import { DesignThemeProvider } from '@/theme/provider'

const RootLayout = () => {
  const themeChoice = useThemePreference((s) => s.choice)
  const { ready, session, load } = useSession()
  const themeReady = useThemePreference((s) => s.ready)
  const loadTheme = useThemePreference((s) => s.load)
  const fontsReady = useDesignFonts()

  useEffect(() => {
    void load()
    void loadTheme()
  }, [load, loadTheme])

  // Native sheets, menus and alerts follow the in-app theme, not only the system one.
  useEffect(
    () => Appearance.setColorScheme(themeChoice === 'system' ? 'unspecified' : themeChoice),
    [themeChoice],
  )

  if (!ready || !themeReady || !fontsReady) return null

  return (
    <DesignThemeProvider>
      <QueryClientProvider client={queryClient}>
        <Stack screenOptions={{ headerShown: false }}>
          <Stack.Protected guard={!!session} redirectTo="/sign-in">
            <Stack.Screen name="(app)" />
          </Stack.Protected>
          <Stack.Protected guard={!session}>
            <Stack.Screen name="sign-in" />
            <Stack.Screen name="phone" />
            <Stack.Screen name="verify-phone" />
            <Stack.Screen name="signup-terms" />
            <Stack.Screen name="phone-registered" />
          </Stack.Protected>
        </Stack>
        <ToastHost />
      </QueryClientProvider>
    </DesignThemeProvider>
  )
}

export default RootLayout
