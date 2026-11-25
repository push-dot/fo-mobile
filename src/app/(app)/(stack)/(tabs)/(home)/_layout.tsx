import { Stack } from 'expo-router'
import { nativeHeaderOptions } from '@/shared/components'
import { useColors } from '@/theme'

const TabStack = () => {
  const clearBar = nativeHeaderOptions(useColors(), true)
  return (
    <Stack screenOptions={{ headerShown: false }}>
      <Stack.Screen name="jobs" options={clearBar} />
      <Stack.Screen name="bookmarks" options={clearBar} />
      <Stack.Screen name="my-activity" options={clearBar} />
      <Stack.Screen name="section/[kind]" options={clearBar} />
    </Stack>
  )
}

export default TabStack
