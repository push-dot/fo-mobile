import { useLocalSearchParams } from 'expo-router'
import { detailFrom } from '@/shared/components/detail-url'
import ProfileDetailScreen from '@/screens/hub/profile-detail-screen'

const Profile = () => {
  const { id, from } = useLocalSearchParams<{ id: string; from?: string }>()
  return <ProfileDetailScreen id={id} from={detailFrom(from)} />
}

export default Profile
