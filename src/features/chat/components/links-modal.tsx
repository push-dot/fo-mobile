import type { LinkKind, UserLink } from '@push/api-client'
import { router } from 'expo-router'
import { useState } from 'react'
import { ScrollView, View } from 'react-native'
import { brandOf } from '@push/shared'
import { onAccent, spacing } from '@/theme'
import { Badge, Button, Chip, GlassButton, Icon, Menu, Text, askConfirm, showToast, type BadgeTone, type IconName } from '@/shared/components'
import { copyText, openUrl } from '@/shared/infrastructure'
import { LINK_DELETED_TOAST, LINK_EMPTY, LINK_UNDO, linkDeleteBody } from '../constants'
import { LINK_KIND_LABEL } from '../utils/links'
import { linkAddPath } from '../utils/sheet-routes'
import { useAddLink, useDeleteLink, useMyLinks } from '@/features/my'
import { useStartChat } from '../api/hooks'
import { useLeaveSidebar } from '../hooks'
import GroupTitle from './group-title'
import Note from './note'
import PageModal from './page-modal'

const KINDS = (Object.keys(LINK_KIND_LABEL) as LinkKind[]).map((key) => ({ key, label: LINK_KIND_LABEL[key] }))
const GROUPS: { title: string; kinds: LinkKind[] }[] = [
  { title: '공고', kinds: ['job'] },
  { title: 'GitHub', kinds: ['github'] },
  { title: '포트폴리오 · 블로그', kinds: ['portfolio', 'blog'] },
  { title: '기타', kinds: ['other'] },
]
const TILE_ICON: Record<LinkKind, IconName | undefined> = { job: 'brief', github: undefined, portfolio: 'folder', blog: 'doc', other: 'link' }
// Job tiles take the company's seed color (title is "회사 · 제목"); other kinds one color per kind.
const tileColor = (l: UserLink) => brandOf(l.kind === 'job' ? l.title.split(' · ')[0]! : l.kind)

const bare = (url: string) => url.replace(/^https?:\/\//, '').replace(/\/$/, '')

const statusOf = (l: UserLink): { label: string; tone: BadgeTone } =>
  l.kind === 'job'
    ? l.fitCount > 0
      ? { label: `맞춤 ${l.fitCount}회`, tone: 'ac' }
      : l.status === 'READING'
        ? { label: '읽는 중', tone: 'orange' }
        : { label: '읽음', tone: 'grey' }
    : l.kind === 'github'
      ? { label: bare(l.url).split('/').length > 2 ? '저장소' : '프로필', tone: 'grey' }
      : { label: KINDS.find((k) => k.key === l.kind)!.label, tone: 'grey' }

/** 내 링크 modal (MyLinks / MyLinksEmpty / MyLinkMenu / MyLinkAdd). */
export const LinksModal = () => {
  const start = useStartChat()
  const leave = useLeaveSidebar()
  const [kind, setKind] = useState<LinkKind | null>(null)
  const q = useMyLinks(true)
  const all = q.data?.data ?? []
  const shown = kind ? all.filter((l) => l.kind === kind) : all
  const remove = useDeleteLink()
  const restore = useAddLink(() => {})

  const act = (l: UserLink, what: 'open' | 'copy' | 'use' | 'delete') => {
    if (what === 'open') void openUrl(l.url)
    if (what === 'copy') void copyText(l.url)
    if (what === 'use')
      leave(
        () =>
          void start(
            l.title,
            l.kind === 'job' ? `${l.url} 공고에 맞춰 내 서류를 고쳐 주세요` : `${l.url} 내용을 근거로 써 주세요`,
            undefined,
            undefined,
            l.kind === 'job' ? 'match_posting' : undefined,
          ),
      )
    if (what === 'delete')
      askConfirm({
        title: '이 링크를 삭제할까요?',
        body: linkDeleteBody(l.title),
        confirm: '삭제',
        cancel: '취소',
        danger: true,
        onConfirm: () =>
          remove.mutate(l.id, {
            onSuccess: () => showToast({ message: LINK_DELETED_TOAST, action: { label: LINK_UNDO, onPress: () => restore.mutate({ url: l.url, kind: l.kind, aiRead: true }) } }),
          }),
      })
  }

  return (
    <PageModal title="내 링크" right={<GlassButton actions={[{ icon: 'plus', label: '링크 추가', onPress: () => router.push(linkAddPath()) }]} />}>
      {q.data && all.length === 0 ? (
        <Empty onAdd={() => router.push(linkAddPath())} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[1], paddingBottom: spacing[1] }}>
            <Chip label={`전체 ${all.length}`} on={!kind} onPress={() => setKind(null)} />
            {KINDS.map((k) => (
              <Chip key={k.key} label={k.label} on={kind === k.key} onPress={() => setKind(k.key)} />
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: spacing[5] }}>
            {GROUPS.map((g) => {
              const items = shown.filter((l) => g.kinds.includes(l.kind))
              if (!items.length) return null
              return (
                <View key={g.title}>
                  <GroupTitle count={items.length}>{g.title}</GroupTitle>
                  {items.map((l) => (
                    <LinkRow key={l.id} link={l} onAct={(what) => act(l, what)} />
                  ))}
                </View>
              )
            })}
          </View>
          <Note>에이전트에서 @언급으로 불러오거나, 서류를 고칠 때 근거로 써요.</Note>
        </>
      )}
    </PageModal>
  )
}

const LinkRow = ({ link, onAct }: { link: UserLink; onAct: (what: 'open' | 'copy' | 'use' | 'delete') => void }) => {
  const icon = TILE_ICON[link.kind]
  const s = statusOf(link)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 64 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tileColor(link), alignItems: 'center', justifyContent: 'center' }}>
        {icon ? (
          <Icon name={icon} size={20} color={onAccent} />
        ) : (
          <Text v="b2" weight="800" style={{ color: onAccent }}>
            GH
          </Text>
        )}
      </View>
      <View style={{ flex: 1, minWidth: 0 }}>
        <Text v="b1" weight="700" numberOfLines={1}>
          {link.title}
        </Text>
        <Text v="c1" color="t3" numberOfLines={1}>
          {bare(link.url)}
        </Text>
      </View>
      <Badge label={s.label} tone={s.tone} />
      <Menu
        accessibilityLabel={`${link.title} 더 보기`}
        actions={[
          { key: 'open', label: '열기', systemImage: 'arrow.up.right.square', onPress: () => onAct('open') },
          { key: 'copy', label: '링크 복사', systemImage: 'doc.on.doc', onPress: () => onAct('copy') },
          { key: 'use', label: '에이전트에서 쓰기', systemImage: 'bubble.left', onPress: () => onAct('use') },
          { key: 'delete', label: '삭제', systemImage: 'xmark', destructive: true, onPress: () => onAct('delete') },
        ]}
      >
        <View style={{ width: 44, height: 44, alignItems: 'center', justifyContent: 'center', marginVertical: -6, marginRight: -spacing[3] }}>
          <Icon name="more" size={20} color="t3" />
        </View>
      </Menu>
    </View>
  )
}

const Empty = ({ onAdd }: { onAdd: () => void }) => {
  return (
    <View style={{ flex: 1, alignItems: 'center', justifyContent: 'center', gap: spacing[2], paddingHorizontal: 40, paddingBottom: 140 }}>
      <Text v="b1" weight="700" color="t2" style={{ textAlign: 'center' }}>
        {LINK_EMPTY}
      </Text>
      <Button label="링크 추가" variant="secondary" size="pill" onPress={onAdd} style={{ marginTop: spacing[3] }} />
    </View>
  )
}
