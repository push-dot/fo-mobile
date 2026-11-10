import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'chat' }

// Chat home defers mount like the other tabs; ConsentPromptListener in the signed-in stack opens consent for off-tab chat starts.
const TabStack = () => <Stack screenOptions={{ headerShown: false }} />

export default TabStack
