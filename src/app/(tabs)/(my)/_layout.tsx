import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'my' }

const TabStack = () => (
  <Stack screenOptions={{ headerShown: false }}>
    <Stack.Screen name="edit-profile/[section]" options={{ presentation: 'modal' }} />
  </Stack>
)

export default TabStack
