import '@/shared/infrastructure/log-ignore'
import { QueryClientProvider } from '@tanstack/react-query'
import { Stack } from 'expo-router'
import * as SplashScreen from 'expo-splash-screen'
import { StatusBar } from 'expo-status-bar'
import { useEffect } from 'react'
import { Appearance, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { queryClient, useAppStateFocus } from '@/providers'
import { RootErrorBoundary, ToastHost } from '@/shared/components'
import SplashGate from '@/shared/infrastructure/splash-gate'
import { noSelectionGrant } from '@/shared/utility'
import { useSession } from '@/shared/infrastructure'
import { useThemeMode, useThemePreference } from '@/theme'
import DesignThemeProvider from '@/theme/provider'

void SplashScreen.preventAutoHideAsync()

const RootLayout = () => {
  const themeChoice = useThemePreference((s) => s.choice)
  const ready = useSession((s) => s.ready)
  const signedIn = useSession((s) => !!s.session)
  const load = useSession((s) => s.load)
  const themeReady = useThemePreference((s) => s.ready)
  const loadTheme = useThemePreference((s) => s.load)
  const mode = useThemeMode()
  useAppStateFocus()

  useEffect(() => {
    void load()
    void loadTheme()
  }, [load, loadTheme])

  useEffect(
    () => Appearance.setColorScheme(themeChoice === 'system' ? 'unspecified' : themeChoice),
    [themeChoice],
  )

  if (!ready || !themeReady) return null

  return (
    <DesignThemeProvider>
      <QueryClientProvider client={queryClient}>
        <RootErrorBoundary>
          <SplashGate sessionReady={ready} themeReady={themeReady} />
          <View style={styles.root} {...noSelectionGrant}>
            <Stack screenOptions={{ headerShown: false }}>
              <Stack.Protected guard={signedIn} redirectTo="/sign-in">
                <Stack.Screen name="(app)" />
              </Stack.Protected>
              <Stack.Protected guard={!signedIn}>
                <Stack.Screen name="sign-in" />
                <Stack.Screen name="phone" />
                <Stack.Screen name="verify-phone" />
                <Stack.Screen name="signup-terms" />
                <Stack.Screen name="terms-view" />
              </Stack.Protected>
            </Stack>
          </View>
          <ToastHost />
        </RootErrorBoundary>
        <StatusBar style={mode === 'dark' ? 'light' : 'dark'} />
      </QueryClientProvider>
    </DesignThemeProvider>
  )
}

const styles = StyleSheet.create(() => ({
  root: { flex: 1 },
}))

export default RootLayout
