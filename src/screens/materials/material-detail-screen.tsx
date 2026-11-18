import { router, useLocalSearchParams } from 'expo-router'
import { useEffect } from 'react'
import { MaterialDetailPage, isMaterialKind } from '@/features/materials'

const MaterialDetailScreen = () => {
  const { kind, id, for: forBot } = useLocalSearchParams<{ kind: string; id: string; for?: string }>()
  const known = isMaterialKind(kind)
  // A deep link with a kind the server does not have closes instead of asking for it.
  useEffect(() => {
    if (!known) router.back()
  }, [known])
  return known ? <MaterialDetailPage kind={kind} id={id} forBot={forBot} /> : null
}

export default MaterialDetailScreen
