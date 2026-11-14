import type { MenuAction, MenuSection } from '@/shared/components/menu-action'

export type PushDocAction = 'posting' | 'export' | 'rename' | 'duplicate' | 'delete'

const ITEMS: Record<PushDocAction, Omit<MenuAction, 'key' | 'onPress'>> = {
  posting: { label: '공고 보기', systemImage: 'arrow.up.right.square', icon: 'ext' },
  export: { label: 'PDF로 내보내기', systemImage: 'arrow.down.to.line', icon: 'download-pdf' },
  rename: { label: '이름 바꾸기', systemImage: 'pencil', icon: 'edit' },
  duplicate: { label: '복제하기', systemImage: 'plus.square.on.square', icon: 'copy' },
  delete: { label: '삭제하기', systemImage: 'trash', icon: 'delete', destructive: true },
}

const GROUPS: { key: string; actions: PushDocAction[] }[] = [
  { key: 'doc', actions: ['posting', 'export', 'rename', 'duplicate'] },
  { key: 'danger', actions: ['delete'] },
]

// 공고 보기 and 복제하기 need a posting: push-be POST documents requires the applicationId, so a document with none cannot be copied.
export const pushDocMenu = (doc: { hasPosting: boolean }, on: Record<PushDocAction, () => void>): MenuSection[] =>
  GROUPS.map(({ key, actions }) => ({
    key,
    actions: actions.filter((a) => (a !== 'posting' && a !== 'duplicate') || doc.hasPosting).map((a) => ({ key: a, ...ITEMS[a], onPress: on[a] })),
  }))
