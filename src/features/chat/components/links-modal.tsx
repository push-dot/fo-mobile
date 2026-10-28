import type { LinkKind, UserLink } from '@push/api-client'
import { useState } from 'react'
import { Alert, Pressable, ScrollView, View } from 'react-native'
import { useColors } from '../../../theme'
import { Badge, BottomSheet, Button, Chip, GlassButton, Icon, Switch, Text, TextField, type BadgeTone, type IconName } from '@/shared/components'
import { openUrl, shareMessage } from '../../../shared/infrastructure'
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
  const [menu, setMenu] = useState<UserLink | null>(null)
  const [adding, setAdding] = useState<LinkKind | 'auto' | null>(null)
  const q = useMyLinks(visible)
  const all = q.data?.data ?? []
  const shown = kind ? all.filter((l) => l.kind === kind) : all
  const remove = useDeleteLink()

  const act = (l: UserLink, what: 'open' | 'copy' | 'use' | 'delete') => {
    setMenu(null)
    if (what === 'open') void openUrl(l.url)
    // shortcut: no clipboard module installed; the share sheet has 복사. Swap for expo-clipboard when added.
    if (what === 'copy') void shareMessage({ message: l.url })
    if (what === 'use') {
      onUse()
      void start(l.title, l.kind === 'job' ? `${l.url} 공고에 맞춰 내 서류를 고쳐 주세요` : `${l.url} 내용을 근거로 써 주세요`)
    }
    if (what === 'delete')
      Alert.alert('링크를 지울까요?', l.title, [
        { text: '취소', style: 'cancel' },
        { text: '삭제', style: 'destructive', onPress: () => remove.mutate(l.id) },
      ])
  }

  return (
    <PageModal visible={visible} onClose={onClose} title="내 링크" right={<GlassButton actions={[{ icon: 'plus', label: '링크 추가', onPress: () => setAdding('auto') }]} />}>
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
                    <LinkRow key={l.id} link={l} onMore={() => setMenu(l)} />
                  ))}
                </View>
              )
            })}
          </View>
          <Note>AI 채팅에서 @언급으로 불러오거나, 서류를 고칠 때 근거로 써요.</Note>
        </>
      )}

      <BottomSheet visible={!!menu} onClose={() => setMenu(null)} title={menu?.title}>
        {menu
          ? (
              [
                ['open', 'ext', '열기'],
                ['copy', 'copy', '링크 복사'],
                ['use', 'chat', 'AI 채팅에서 쓰기'],
                ['delete', 'x', '삭제'],
              ] as const
            ).map(([k, icon, label]) => (
              <Pressable key={k} accessibilityRole="button" onPress={() => act(menu, k)} style={{ flexDirection: 'row', alignItems: 'center', gap: 12, minHeight: 48 }}>
                <Icon name={icon} size={20} color={k === 'delete' ? 'red' : 't2'} />
                <Text v="b1" color={k === 'delete' ? 'red' : 't1'}>
                  {label}
                </Text>
              </Pressable>
            ))
          : null}
      </BottomSheet>
      <AddLinkSheet open={adding} onClose={() => setAdding(null)} />
    </PageModal>
  )
}

const LinkRow = ({ link, onMore }: { link: UserLink; onMore: () => void }) => {
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
      <Pressable accessibilityRole="button" accessibilityLabel={`${link.title} 더 보기`} onPress={onMore} hitSlop={6} style={{ width: 36, height: 44, alignItems: 'center', justifyContent: 'center', marginRight: -8 }}>
        <Icon name="more" size={20} color="t3" />
      </Pressable>
    </View>
  )
}

const Empty = ({ onAdd }: { onAdd: (k: LinkKind | 'auto') => void }) => {
  const c = useColors()
  return (
    <View style={{ alignItems: 'center', gap: 10, paddingTop: 80, paddingHorizontal: 32 }}>
      <View style={{ width: 64, height: 64, borderRadius: 20, backgroundColor: c.acSoft, alignItems: 'center', justifyContent: 'center', marginBottom: 6 }}>
        <Icon name="link" size={30} color="acText" />
      </View>
      <Text v="h2">아직 모아 둔 링크가 없어요</Text>
      <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
        {'공고, GitHub, 포트폴리오, 블로그 링크를\n모아 두면 AI가 서류를 고칠 때 근거로 써요.'}
      </Text>
      <Button label="링크 추가" icon="plus" onPress={() => onAdd('auto')} style={{ marginTop: 10, alignSelf: 'stretch' }} />
      <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 8, justifyContent: 'center', marginTop: 6 }}>
        {KINDS.slice(0, 4).map((k) => (
          <Chip key={k.key} label={k.label} onPress={() => onAdd(k.key)} />
        ))}
      </View>
    </View>
  )
}

const AddLinkSheet = ({ open, onClose }: { open: LinkKind | 'auto' | null; onClose: () => void }) => {
  const c = useColors()
  const [url, setUrl] = useState('')
  const [picked, setPicked] = useState<LinkKind | null>(null)
  const [aiRead, setAiRead] = useState(true)
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
      action={{ label: '추가하기', onPress: () => add.mutate({ url: full, kind: kind ?? undefined, aiRead }), disabled: !valid || add.isPending }}
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
          추가하면 AI가 README와 커밋을 읽어 둬요
        </Text>
        <Switch label="AI가 읽어 두기" value={aiRead} onValueChange={setAiRead} />
      </View>
    </BottomSheet>
  )
}
