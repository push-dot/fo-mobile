import { useLocalSearchParams } from 'expo-router'
import ApplicationDetailScreen from '@/screens/my/application-detail-screen'

const ApplicationDetail = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <ApplicationDetailScreen id={id} />
}

export default ApplicationDetail
