import { lazyTab } from '@/shared/navigation'

export default lazyTab(() => import('@/screens/hub/hub-screen'))
