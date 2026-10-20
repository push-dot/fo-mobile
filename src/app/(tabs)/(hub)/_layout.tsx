import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'hub' }

export default function TabStack() {
  return <Stack screenOptions={{ headerShown: false }} />
}
