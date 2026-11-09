import MyScreen from '@/screens/my/my-screen'
import { useFocusedOnce } from '@/shared/navigation'

const My = () => (useFocusedOnce() ? <MyScreen /> : null)

export default My
