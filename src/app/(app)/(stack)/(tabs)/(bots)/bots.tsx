import { lazyTab } from '@/shared/navigation'

export default lazyTab(() => import('@/screens/bots/bot-home-screen'))
