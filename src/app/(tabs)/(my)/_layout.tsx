import { Stack } from 'expo-router'
import { sheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'my' }

const TabStack = () => {
  const c = useColors()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="edit-profile/[section]" options={{ presentation: 'modal' }} />
      <Stack.Screen name="confirm" options={sheetOptions(c)} />
    </Stack>
  )
}

export default TabStack
