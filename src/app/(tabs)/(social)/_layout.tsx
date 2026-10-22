import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'social' }

const TabStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="compose" options={{ presentation: 'modal' }} />
  </Stack>
)

export default TabStack
