import { Drawer } from 'expo-router/drawer'
import { ChatSidebar } from '@/features/chat'
import { useColors } from '@/theme'

// The chat sidebar covers the whole app, tab bar included (design: full-width slide bar). Only the chat screens open it.
const AppDrawer = () => {
  const c = useColors()
  return (
    <Drawer
      drawerContent={(props) => <ChatSidebar onClose={() => props.navigation.closeDrawer()} />}
      screenOptions={{
        headerShown: false,
        swipeEnabled: false,
        drawerType: 'front',
        drawerStyle: { width: '100%', backgroundColor: c.bg },
        overlayColor: 'transparent',
      }}
    >
      <Drawer.Screen name="(stack)" />
    </Drawer>
  )
}

export default AppDrawer
