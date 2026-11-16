import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { PageModal } from '@/features/chat'
import { GlassButton } from '@/shared/components'
import { useInMaterialsModal } from './in-materials-modal'

/** MaterialDetail* and BotPick: a page pushed inside the 자료 modal (never a sheet over it); opened from a chat source it is a plain page. */
export const MaterialPage = ({ title, children }: { title: string; children: ReactNode }) => {
  const inModal = useInMaterialsModal()
  return (
    <PageModal title={title} mpage={inModal} page={!inModal} left={<GlassButton circle iconSize={20} actions={[{ icon: 'back', label: '뒤로', onPress: () => router.back() }]} />}>
      {children}
    </PageModal>
  )
}
