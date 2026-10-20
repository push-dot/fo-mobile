import { useLocalSearchParams } from 'expo-router'
import { EditProfileScreen } from '../../../../features/my/EditProfileScreen'
import type { ProfileSection } from '../../../../features/my/ProfileTab'

export default function Route() {
  const { section } = useLocalSearchParams<{ section: ProfileSection }>()
  return <EditProfileScreen section={section} />
}
