import HubScreen from '@/screens/hub/hub-screen'
import { useFocusedOnce } from '@/shared/navigation'

const Hub = () => (useFocusedOnce() ? <HubScreen /> : null)

export default Hub
