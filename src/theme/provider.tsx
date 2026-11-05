import { DarkTheme, DefaultTheme, ThemeProvider } from 'expo-router'
import type { ReactNode } from 'react'
import { navigationColors } from './navigation-colors'
import { useColors, useThemeMode } from './index'

/** App chrome follows @push/design-system, not the stock navigation palette. */
export const DesignThemeProvider = ({ children }: { children: ReactNode }) => {
  const mode = useThemeMode()
  const colors = useColors()
  const base = mode === 'dark' ? DarkTheme : DefaultTheme
  return (
    <ThemeProvider value={{ ...base, colors: { ...base.colors, ...navigationColors(colors) } }}>
      {children}
    </ThemeProvider>
  )
}
