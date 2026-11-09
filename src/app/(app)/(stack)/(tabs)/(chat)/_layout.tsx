import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'chat' }

// Not mounted on first focus like the other tabs: ChatHomeScreen's ConsentSheet opens consent for chats started from them.
const TabStack = () => <Stack screenOptions={{ headerShown: false }} />

export default TabStack
