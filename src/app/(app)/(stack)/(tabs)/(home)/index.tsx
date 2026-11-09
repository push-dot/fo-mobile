import HomeScreen from '@/screens/home/home-screen'
import { useFocusedOnce } from '@/shared/navigation'

const Home = () => (useFocusedOnce() ? <HomeScreen /> : null)

export default Home
