import { useLocalSearchParams, router } from 'expo-router'
import { useState } from 'react'
import { LOCAL_DRAFT } from '@/features/chat'
import MaterialPickerScreen from '@/screens/chat/material-picker-screen'

const MaterialPicker = () => {
  const rawBot = useLocalSearchParams<{ bot?: string | string[] }>().bot
  const [target] = useState(() => (Array.isArray(rawBot) ? rawBot[0] : rawBot) || LOCAL_DRAFT)
  return <MaterialPickerScreen target={target} onClose={() => router.back()} />
}

export default MaterialPicker
