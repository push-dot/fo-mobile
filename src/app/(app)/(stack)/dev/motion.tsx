import { Redirect } from 'expo-router'
import MotionCheckScreen from '@/screens/dev/motion-check-screen'
import { API_MOCK } from '@/shared/infrastructure'

const MotionCheck = () => (API_MOCK ? <MotionCheckScreen /> : <Redirect href="/" />)

export default MotionCheck
