import { lazyTab } from '@/shared/navigation'

export default lazyTab(() => import('@/screens/social/social-screen'))
