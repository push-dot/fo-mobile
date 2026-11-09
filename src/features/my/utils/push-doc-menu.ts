import type { MenuAction, MenuSection } from '@/shared/components/menu-action'

export type PushDocAction = 'posting' | 'export' | 'rename' | 'delete'

const ITEMS: Record<PushDocAction, Omit<MenuAction, 'key' | 'onPress'>> = {
  posting: { label: '공고 보기', systemImage: 'arrow.up.right.square', icon: 'ext' },
  export: { label: 'PDF로 내보내기', systemImage: 'arrow.down.to.line', icon: 'download-pdf' },
  rename: { label: '이름 바꾸기', systemImage: 'pencil', icon: 'edit' },
  delete: { label: '삭제하기', systemImage: 'trash', icon: 'delete', destructive: true },
}

const GROUPS: { key: string; actions: PushDocAction[] }[] = [
  { key: 'doc', actions: ['posting', 'export', 'rename'] },
  { key: 'danger', actions: ['delete'] },
]

export const pushDocMenu = (doc: { hasPosting: boolean }, on: Record<PushDocAction, () => void>): MenuSection[] =>
  GROUPS.map(({ key, actions }) => ({
    key,
    actions: actions.filter((a) => a !== 'posting' || doc.hasPosting).map((a) => ({ key: a, ...ITEMS[a], onPress: on[a] })),
  }))
