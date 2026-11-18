import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { anchor: 'social' }

const TabStack = () => <Stack screenOptions={{ headerShown: false }} />

export default TabStack
