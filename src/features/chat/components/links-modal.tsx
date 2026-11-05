import type { LinkKind, UserLink } from '@push/api-client'
import { useState } from 'react'
import { Alert, ScrollView, View } from 'react-native'
import { useColors } from '../../../theme'
import { Badge, BottomSheet, Button, Chip, GlassButton, Icon, Menu, Text, TextField, ToastHost, showToast, type BadgeTone, type IconName } from '@/shared/components'
import { openUrl, shareMessage } from '../../../shared/infrastructure'
import { LINK_ADD_NOTE, LINK_DELETED_TOAST, LINK_EMPTY, LINK_UNDO, linkDeleteBody } from '../constants'
import { kindOf } from '../utils/links'
import { useAddLink, useDeleteLink, useMyLinks } from '@/features/my'
import { useStartChat } from '../api/hooks'
import GroupTitle from './group-title'
import Note from './note'
import PageModal from './page-modal'

const KINDS: { key: LinkKind; label: string }[] = [
  { key: 'job', label: '공고' },
  { key: 'github', label: 'GitHub' },
  { key: 'portfolio', label: '포트폴리오' },
  { key: 'blog', label: '블로그' },
  { key: 'other', label: '기타' },
]
const GROUPS: { title: string; kinds: LinkKind[] }[] = [
  { title: '공고', kinds: ['job'] },
  { title: 'GitHub', kinds: ['github'] },
  { title: '포트폴리오 · 블로그', kinds: ['portfolio', 'blog'] },
  { title: '기타', kinds: ['other'] },
]
// Board tile colors per kind; no theme token covers brand tiles.
const TILE: Record<LinkKind, { color: string; icon?: IconName }> = {
  job: { color: '#1F3A8A', icon: 'brief' },
  github: { color: '#24292F' },
  portfolio: { color: '#5F3DC4', icon: 'folder' },
  blog: { color: '#0C8599', icon: 'doc' },
  other: { color: '#495057', icon: 'link' },
}

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
export const LinksModal = ({ visible, onClose, onUse }: { visible: boolean; onClose: () => void; onUse: () => void }) => {
  const start = useStartChat()
  const [kind, setKind] = useState<LinkKind | null>(null)
  const [adding, setAdding] = useState<LinkKind | 'auto' | null>(null)
  const q = useMyLinks(visible)
  const all = q.data?.data ?? []
  const shown = kind ? all.filter((l) => l.kind === kind) : all
  const remove = useDeleteLink()
  const restore = useAddLink(() => {})

  const act = (l: UserLink, what: 'open' | 'copy' | 'use' | 'delete') => {
    if (what === 'open') void openUrl(l.url)
    // shortcut: no clipboard module installed; the share sheet has 복사. Swap for expo-clipboard when added.
    if (what === 'copy') void shareMessage({ message: l.url })
    if (what === 'use') {
      onUse()
      void start(
        l.title,
        l.kind === 'job' ? `${l.url} 공고에 맞춰 내 서류를 고쳐 주세요` : `${l.url} 내용을 근거로 써 주세요`,
        undefined,
        undefined,
        l.kind === 'job' ? 'match_posting' : undefined,
      )
    }
    if (what === 'delete')
      Alert.alert('이 링크를 삭제할까요?', linkDeleteBody(l.title), [
        { text: '취소', style: 'cancel' },
        {
          text: '삭제',
          style: 'destructive',
          onPress: () =>
            remove.mutate(l.id, {
              onSuccess: () => showToast({ message: LINK_DELETED_TOAST, action: { label: LINK_UNDO, onPress: () => restore.mutate({ url: l.url, kind: l.kind, aiRead: true }) } }),
            }),
        },
      ])
  }

  return (
    <PageModal visible={visible} onClose={onClose} title="내 링크" right={<GlassButton actions={[{ icon: 'plus', label: '링크 추가', onPress: () => setAdding('auto') }]} />}>
      <ToastHost />
      {q.data && all.length === 0 ? (
        <Empty onAdd={setAdding} />
      ) : (
        <>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} contentContainerStyle={{ gap: 8, paddingHorizontal: 20, paddingTop: 2, paddingBottom: 4 }}>
            <Chip label={`전체 ${all.length}`} on={!kind} onPress={() => setKind(null)} />
            {KINDS.map((k) => (
              <Chip key={k.key} label={k.label} on={kind === k.key} onPress={() => setKind(k.key)} />
            ))}
          </ScrollView>
          <View style={{ paddingHorizontal: 20 }}>
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

      <AddLinkSheet open={adding} onClose={() => setAdding(null)} />
    </PageModal>
  )
}

const LinkRow = ({ link, onAct }: { link: UserLink; onAct: (what: 'open' | 'copy' | 'use' | 'delete') => void }) => {
  const tile = TILE[link.kind]
  const s = statusOf(link)
  return (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 64 }}>
      <View style={{ width: 44, height: 44, borderRadius: 14, backgroundColor: tile.color, alignItems: 'center', justifyContent: 'center' }}>
        {tile.icon ? (
          <Icon name={tile.icon} size={20} color="#FFFFFF" />
        ) : (
          <Text weight="800" style={{ color: '#FFFFFF', fontSize: 15 }}>
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
          { key: 'open', label: '열기', onPress: () => onAct('open') },
          { key: 'copy', label: '링크 복사', onPress: () => onAct('copy') },
          { key: 'use', label: '에이전트에서 쓰기', onPress: () => onAct('use') },
          { key: 'delete', label: '삭제', destructive: true, onPress: () => onAct('delete') },
        ]}
      >
        <View style={{ width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 }}>
          <Icon name="more" size={20} color="t3" />
        </View>
      </Menu>
    </View>
  )
}

const Empty = ({ onAdd }: { onAdd: (k: LinkKind | 'auto') => void }) => {
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 80, paddingHorizontal: 32 }}>
      <Text v="h2">{LINK_EMPTY}</Text>
      <Button label="링크 추가" icon="plus" onPress={() => onAdd('auto')} style={{ marginTop: 10, alignSelf: 'stretch' }} />
    </View>
  )
}

const AddLinkSheet = ({ open, onClose }: { open: LinkKind | 'auto' | null; onClose: () => void }) => {
  const c = useColors()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const preset = open && open !== 'auto' ? open : null
  const kind = picked ?? preset ?? (url.trim() ? kindOf(url) : null)
  const full = /^https?:\/\//.test(url.trim()) ? url.trim() : `https://${url.trim()}`
  const valid = /^https?:\/\/[^\s@/]+\.[^\s@]+$/.test(full)
  const close = () => (setUrl(''), setPicked(null), onClose())
  const add = useAddLink(close)
  return (
    <BottomSheet
      visible={!!open}
      onClose={close}
      title="링크 추가"
      description="링크를 붙여넣으면 종류를 알아서 골라요."
      action={{ label: '추가하기', onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead: true }), disabled: !valid || add.isPending }}
    >
      <TextField icon="link" placeholder="https://" value={url} onChangeText={setUrl} autoCapitalize="none" autoCorrect={false} keyboardType="url" autoFocus accessibilityLabel="링크 주소" />
      <View style={{ gap: 8 }}>
        <Text v="c1" weight="700" color="t3">
          종류
        </Text>
        <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8 }}>
          {KINDS.map((k) => (
            <Chip key={k.key} label={k.label} on={kind === k.key} onPress={() => setPicked(k.key)} />
          ))}
        </View>
      </View>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 12, paddingVertical: 12, paddingHorizontal: 14, borderRadius: 14, backgroundColor: c.bg2 }}>
        <Icon name="spark" size={20} color="acText" />
        <Text v="b2" style={{ flex: 1 }}>
          {LINK_ADD_NOTE}
        </Text>
      </View>
    </BottomSheet>
  )
}
