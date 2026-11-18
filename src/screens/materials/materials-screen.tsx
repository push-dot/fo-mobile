import { useLocalSearchParams } from 'expo-router'
import { MaterialsModal } from '@/features/materials'

const MaterialsScreen = () => {
  const { for: forBot } = useLocalSearchParams<{ for?: string }>()
  return <MaterialsModal forBot={forBot} />
}

export default MaterialsScreen
