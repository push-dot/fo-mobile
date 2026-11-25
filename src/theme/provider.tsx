import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router'
import type { ReactNode } from 'react'
import { navigationColors } from './navigation-colors'
import { useColors, useThemeMode } from './index'

export const DesignThemeProvider = ({ children }: { children: ReactNode }) => {
  const mode = useThemeMode()
  const colors = useColors()
  const base = mode === 'dark' ? DarkTheme : DefaultTheme
  const value = { ...base, colors: { ...base.colors, ...navigationColors(colors) } }
  return <ThemeProvider value={value}>{children}</ThemeProvider>
}
