import { Stack } from 'expo-router'
import { Platform } from 'react-native'
import { sheetOptions } from '@/shared/navigation'
import { useColors } from '@/theme'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'social' }

const TabStack = () => {
  const c = useColors()
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="compose" options={Platform.OS === 'android' ? sheetOptions(c, [1]) : { presentation: 'modal' }} />
    </Stack>
  )
}

export default TabStack
