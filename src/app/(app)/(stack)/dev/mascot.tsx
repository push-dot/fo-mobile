import { Redirect, useLocalSearchParams } from 'expo-router'
import MascotGalleryScreen from '@/screens/dev/mascot-gallery-screen'
import { API_MOCK } from '@/shared/infrastructure'

const MascotGallery = () => {
  const { probe } = useLocalSearchParams<{ probe?: string }>()
  return API_MOCK ? <MascotGalleryScreen probe={probe === '1'} /> : <Redirect href="/" />
}

export default MascotGallery
