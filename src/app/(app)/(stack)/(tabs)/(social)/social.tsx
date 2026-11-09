import SocialScreen from '@/screens/social/social-screen'
import { useFocusedOnce } from '@/shared/navigation'

const Social = () => (useFocusedOnce() ? <SocialScreen /> : null)

export default Social
