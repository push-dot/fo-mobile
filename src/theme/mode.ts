export const THEME_CHOICES = [
  { key: 'light', label: '라이트' },
  { key: 'dark', label: '다크' },
  { key: 'system', label: '시스템' },
] as const

export type ThemeChoice = (typeof THEME_CHOICES)[number]['key']

export const themeMode = (choice: ThemeChoice, system: 'light' | 'dark' | null): 'light' | 'dark' => {
  if (choice === 'light' || choice === 'dark') return choice
  return system === 'dark' ? 'dark' : 'light'
}
