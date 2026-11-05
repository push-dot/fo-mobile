import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'hub' }

const TabStack = () => <Stack screenOptions={{ headerShown: false }} />

export default TabStack
