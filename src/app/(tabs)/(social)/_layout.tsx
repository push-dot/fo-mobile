import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'social' }

export default function TabStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* 글쓰기 시트: iOS page sheet. */}
      <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
