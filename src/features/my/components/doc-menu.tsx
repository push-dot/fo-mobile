import { router } from 'expo-router'
import type { ReactElement } from 'react'
import { Menu } from '@/shared/components'
import type { MySource } from '../types'

const DocMenu = ({
  doc,
  viewing,
  onDelete,
  children,
}: {
  doc: Pick<MySource, 'id' | 'fileName'>
  viewing?: boolean
  onDelete: () => void
  children: ReactElement
}) => (
  <Menu
    accessibilityLabel={`${doc.fileName} 더 보기`}
    actions={[
      ...(viewing
        ? []
        : [{ key: 'open', label: '서류 보기', systemImage: 'doc.text' as const, onPress: () => router.push(`/docs/${doc.id}`) }]),
      { key: 'delete', label: '서류 삭제하기', systemImage: 'trash' as const, destructive: true, onPress: onDelete },
    ]}
  >
    {children}
  </Menu>
)

export default DocMenu
