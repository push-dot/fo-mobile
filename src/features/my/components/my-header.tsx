import { router } from 'expo-router'
import { GlassButton, Text, TopBar } from '@/shared/components'
import { useUnreadOffers } from '../api/hooks'

const MyHeader = () => {
  const { data: unread = 0 } = useUnreadOffers()
  return (
    <TopBar
      left={
        <Text v="h1" accessibilityRole="header" style={{ fontSize: 26, lineHeight: 32 }}>
          마이
        </Text>
      }
      right={
        <>
          <GlassButton
            actions={[
              {
                icon: 'inbox',
                label: unread ? `받은 제안 ${unread}개` : '제안함',
                badge: unread,
                onPress: () => router.push('/offers'),
              },
            ]}
          />
          <GlassButton
            actions={[{ icon: 'gear', label: '설정', onPress: () => router.push('/settings') }]}
          />
        </>
      }
    />
  )
}

export default MyHeader
