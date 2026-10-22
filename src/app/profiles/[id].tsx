import { useLocalSearchParams } from 'expo-router'
import ProfileDetailScreen from '@/screens/hub/profile-detail-screen'

const Profile = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProfileDetailScreen id={id} />
}

export default Profile
