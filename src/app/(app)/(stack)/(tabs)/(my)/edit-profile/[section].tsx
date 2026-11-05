import { useLocalSearchParams } from 'expo-router'
import type { ProfileSection } from '@/features/my'
import EditProfileScreen from '@/screens/my/edit-profile-screen'

const EditProfile = () => {
  const { section } = useLocalSearchParams<{ section: ProfileSection }>()
  return <EditProfileScreen section={section} />
}

export default EditProfile
