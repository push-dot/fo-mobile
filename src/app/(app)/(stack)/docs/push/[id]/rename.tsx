import { useLocalSearchParams } from 'expo-router'
import { DocRenameSheet } from '@/features/my'

const DocRenameRoute = () => {
  const { id } = useLocalSearchParams<{ id: string }>()
  return <DocRenameSheet id={id} />
}

export default DocRenameRoute
