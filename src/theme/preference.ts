import * as SecureStore from 'expo-secure-store'
import { create } from 'zustand'
import { type ThemeChoice } from './mode'

const KEY = 'push.theme'

const isChoice = (value: string | null): value is ThemeChoice =>
  value === 'light' || value === 'dark' || value === 'system'

type State = {
  choice: ThemeChoice
  ready: boolean
  load: () => Promise<void>
  setChoice: (choice: ThemeChoice) => Promise<void>
}

export const useThemePreference = create<State>((set) => ({
  choice: 'system',
  ready: false,
  load: async () => {
    const raw = await SecureStore.getItemAsync(KEY)
    set({ choice: isChoice(raw) ? raw : 'system', ready: true })
  },
  setChoice: async (choice) => {
    await SecureStore.setItemAsync(KEY, choice)
    set({ choice })
  },
}))
