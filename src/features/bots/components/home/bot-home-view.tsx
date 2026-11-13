import { router } from 'expo-router'
import { useCallback, useState } from 'react'
import { FlatList, Platform, View, useWindowDimensions } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { askConfirm, useKeyboardHeight, type MenuAction } from '@/shared/components'
import { useColors } from '../../../../theme'
import { useBotSearch } from '../../api/hooks'
import { CANCEL_LABEL, DELETE_ACTION, DELETE_BODY, deleteTitle } from '../profile/profile-rows'
import { XL_FONT_SCALE } from '../new/copy'
import type { Bot, CompanyBot, LocalActivity } from '../../types'
import { botRow } from '../../utils/live-state'
import { accountLabel, companyMenu, dropDeleted, rowMotion, splitHome, type HomeMenuKey } from '../../utils/home-rows'
import { accountPath, botChatAtPath, botChatPath, botNewPath, botProfilePath, materialsPath } from '../../utils/paths'
import BotHomeBar from './bot-home-bar'
import BotHomeEmpty from './bot-home-empty'
import BotHomeError from './bot-home-error'
import BotHomeHeader from './bot-home-header'
import BotHomeHero from './bot-home-hero'
import BotHomeLoading from './bot-home-loading'
import BotHomeRow from './bot-home-row'
import BotHomeSearch from './bot-home-search'
import { FIRST_SCREEN, LIST_BOTTOM, TAB_CLEARANCE } from './copy'
import { homeChrome } from './metrics'

const VIEWABILITY = { itemVisiblePercentThreshold: 60 }

const MENU_ICON: Record<HomeMenuKey, { icon: MenuAction['icon']; systemImage: MenuAction['systemImage'] }> = {
  profile: { icon: 'user', systemImage: 'person' },
  find: { icon: 'search', systemImage: 'magnifyingglass' },
  read: { icon: 'check', systemImage: 'checkmark' },
  mute: { icon: 'bell', systemImage: 'bell' },
  delete: { icon: 'x', systemImage: 'trash' },
}

const BotHomeView = ({
  bots,
  fallbackPush,
  local,
  loading,
  error,
  accountName,
  plan,
  onRetry,
  onDelete,
  onRead,
  onMute,
  onForget,
}: {
  bots: Bot[] | undefined
  fallbackPush: Bot | undefined
  local: Readonly<Record<string, LocalActivity | undefined>>
  loading: boolean
  error: boolean
  accountName: string
  plan: string | undefined
  onRetry: () => void
  onDelete: (bot: CompanyBot) => Promise<void>
  onRead: (bot: Bot) => void
  onMute: (bot: Bot, muted: boolean) => void
  onForget: (id: string) => void
}) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const xl = useWindowDimensions().fontScale >= XL_FONT_SCALE
  const chrome = homeChrome(xl)
  const [query, setQuery] = useState<string | null>(null)
  const [scrolling, setScrolling] = useState(false)
  const [visible, setVisible] = useState<ReadonlySet<string> | null>(null)
  const searching = query !== null
  const found = useBotSearch(query ?? '')
  const now = new Date()
  const home = splitHome(bots ?? [])
  const push = home.push ?? (fallbackPush?.kind === 'push' ? fallbackPush : undefined)
  const top = insets.top + chrome.header
  // The iOS tab bar floats over this view, so the bar rests above it; Android's tab bar takes its own space.
  const lift = keyboard > 0 ? Math.max(0, keyboard - TAB_CLEARANCE) : Platform.OS === 'ios' ? TAB_CLEARANCE + 8 : 8
  const screen = { flex: 1, backgroundColor: c.bg }
  const fade = { position: 'absolute' as const, left: 0, right: 0, bottom: lift, height: 160, zIndex: 3 }
  const listPad = { paddingTop: top, paddingBottom: LIST_BOTTOM }
  const onViewableItemsChanged = useCallback<NonNullable<FlatList<Bot>['props']['onViewableItemsChanged']>>(({ viewableItems }) => {
    setVisible(new Set(viewableItems.flatMap((item) => (item.key ? [item.key] : []))))
  }, [])

  const openChat = (bot: Bot) => router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))
  const openMaterials = () => router.push(materialsPath())

  const run = (key: HomeMenuKey, bot: CompanyBot) => {
    if (key === 'profile') router.push(botProfilePath(bot.id))
    if (key === 'find') router.push(botChatPath(bot.id))
    if (key === 'read') onRead(bot)
    if (key === 'mute') onMute(bot, !bot.muted)
    if (key === 'delete') {
      askConfirm({
        title: deleteTitle(bot.name),
        body: DELETE_BODY,
        confirm: DELETE_ACTION,
        cancel: CANCEL_LABEL,
        danger: true,
        onConfirm: () => {
          void onDelete(bot)
            .then(() => dropDeleted(home.companies, bot.id, onForget))
            .catch(() => undefined)
        },
      })
    }
  }

  const actionsFor = (bot: CompanyBot): MenuAction[] =>
    companyMenu(bot.kind, bot.muted).map((item) => ({
      key: item.key,
      label: item.label,
      destructive: item.destructive,
      icon: MENU_ICON[item.key].icon,
      systemImage: MENU_ICON[item.key].systemImage,
      onPress: () => run(item.key, bot),
    }))

  const hero = push ? (
    <BotHomeHero chrome={chrome} state={botRow(push, local[push.id], now).mascot} unread={botRow(push, local[push.id], now).unreadDot} motion={rowMotion(botRow(push, local[push.id], now).mascot, 0, false)} onPress={() => openChat(push)} />
  ) : null

  return (
    <View style={screen}>
      {searching ? null : (
        <BotHomeHeader chrome={chrome} topInset={insets.top} label={accountLabel(accountName, plan)} name={accountName} onAccount={() => router.push(accountPath())} onNew={() => router.push(botNewPath())} />
      )}
      {searching ? (
        <BotHomeSearch
          query={query}
          data={found.data}
          pending={found.isLoading}
          local={local}
          now={now}
          chrome={chrome}
          top={insets.top + 12}
          onOpenBot={openChat}
          onOpenMessage={(id, messageId) => router.push(botChatAtPath(id as Bot['id'], messageId))}
        />
      ) : loading && !bots ? (
        <BotHomeLoading chrome={chrome} top={top} />
      ) : (
        <FlatList
          data={home.companies}
          keyExtractor={(bot) => bot.id}
          extraData={scrolling ? 'scroll' : visible ? [...visible].join('|') : 'open'}
          contentContainerStyle={listPad}
          keyboardDismissMode="on-drag"
          viewabilityConfig={VIEWABILITY}
          onViewableItemsChanged={onViewableItemsChanged}
          onScrollBeginDrag={() => setScrolling(true)}
          onScrollEndDrag={() => setScrolling(false)}
          onMomentumScrollEnd={() => setScrolling(false)}
          ListHeaderComponent={
            <View>
              {hero}
              {error && !bots ? <BotHomeError onRetry={onRetry} /> : null}
              {bots && home.companies.length === 0 ? <BotHomeEmpty onCreate={() => router.push(botNewPath())} /> : null}
            </View>
          }
          renderItem={({ item, index }) => {
            const held = scrolling || (visible ? !visible.has(item.id) : index >= FIRST_SCREEN)
            return (
              <BotHomeRow
                row={botRow(item, local[item.id], now)}
                chrome={chrome}
                index={index}
                held={held}
                actions={item.kind === 'company' ? actionsFor(item) : []}
                onPress={() => openChat(item)}
              />
            )
          }}
        />
      )}
      <LinearGradient pointerEvents="none" colors={[`${c.bg}00`, c.bg, c.bg]} locations={[0, 0.45, 1]} style={fade} />
      <BotHomeBar
        chrome={chrome}
        lift={lift}
        searching={searching}
        query={query ?? ''}
        onSearch={() => setQuery('')}
        onMaterials={openMaterials}
        onChange={setQuery}
        onClose={() => setQuery(null)}
      />
    </View>
  )
}

export default BotHomeView
