import { Stack } from 'expo-router'

// Unique initial route per tab group avoids duplicate "/" paths across groups.
export const unstable_settings = { initialRouteName: 'my' }

export default function TabStack() {
  return (
    <Stack screenOptions={{ headerShown: false }}>
      {/* Section edit sheets (EditProfileBasic · EditIntro · EditCareer · EditSkills boards). */}
      <Stack.Screen name="edit-profile/[section]" options={{ presentation: 'modal' }} />
    </Stack>
  )
}
