import { useLocalSearchParams } from 'expo-router'
import { AccountModal } from '@/features/chat'

const AccountScreen = () => {
  const { page } = useLocalSearchParams<{ page?: 'plan' }>()
  return <AccountModal initialPage={page === 'plan' ? 'plan' : 'account'} />
}

export default AccountScreen
