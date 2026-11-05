import { useLocalSearchParams } from 'expo-router'
import { RenameSheet } from '@/features/chat'

const RenameRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <RenameSheet id={id} />
}

export default RenameRoute
