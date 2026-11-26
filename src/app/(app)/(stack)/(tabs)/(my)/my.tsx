import { lazyTab } from '@/shared/navigation'

export default lazyTab(() => import('@/screens/my/my-screen'))
