import { useLocalSearchParams } from 'expo-router'
import { ProfileDetailScreen } from '../../features/detail/ProfileDetailScreen'

export default function Screen() {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ProfileDetailScreen id={id} />
}
