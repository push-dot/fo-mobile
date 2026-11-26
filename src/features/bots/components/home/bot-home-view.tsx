import { router } from 'expo-router'
import { LegendList, useViewability } from '@legendapp/list/react-native'
import { useEffect, useState } from 'react'
import { Platform, View } from 'react-native'
import { LinearGradient } from 'expo-linear-gradient'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { useKeyboardHeight, type MenuAction } from '@/shared/components'
import { useColors } from '../../../../theme'
import { useBotSearch } from '../../api/hooks'
import { confirmDeleteBot } from '../profile/confirm-delete-bot'
import { useXlBoardText, XlBoardChrome } from '@/shared/components/xl-chrome'
import type { Bot, CompanyBot, LocalActivity } from '../../types'
import { botRow } from '../../utils/live-state'
import { accountLabel, companyMenu, rowMotion, splitHome, type HomeMenuKey } from '../../utils/home-rows'
import { openBotNew } from '../../utils/open-bot-new'
import { accountPath, botChatAtPath, botChatPath, botProfilePath, materialsPath } from '../../utils/paths'
import BotHomeBar from './bot-home-bar'
import BotHomeError from './bot-home-error'
import BotHomeHeader from './bot-home-header'
import BotHomeHero from './bot-home-hero'
import BotHomeLoading from './bot-home-loading'
import BotHomeRow from './bot-home-row'
import BotHomeSearch from './bot-home-search'
import { FIRST_SCREEN, LIST_BOTTOM } from './copy'
import { SEARCH_DEBOUNCE_MS } from '../new/copy'
import { barLift } from './bar-lift'
import { homeChrome, type HomeChrome } from './metrics'

const VIEWABILITY = { itemVisiblePercentThreshold: 60 }

const MENU_SYMBOL: Record<HomeMenuKey, MenuAction['systemImage']> = {
  profile: 'person',
  find: 'magnifyingglass',
  read: 'checkmark.circle',
  mute: 'bell.slash',
  delete: 'trash',
}

const MENU_ICON: Record<HomeMenuKey, MenuAction['icon']> = {
  profile: 'user',
  find: 'search',
  read: 'check',
  mute: 'bell-off',
  delete: 'delete',
}

const openChat = (bot: Bot) => router.push(botChatPath(bot.kind === 'push' ? 'push' : bot.id))

const menuActions = (bot: Bot, onMenu: (key: HomeMenuKey, bot: Bot) => void): MenuAction[] =>
  companyMenu(bot.kind).map((item) => ({
    key: item.key,
    label: item.label,
    destructive: item.destructive,
    systemImage: item.key === 'mute' && bot.muted ? 'bell' : MENU_SYMBOL[item.key],
    icon: item.key === 'mute' && bot.muted ? 'bell' : MENU_ICON[item.key],
    onPress: () => onMenu(item.key, bot),
  }))

type HomeRowProps = {
  bot: Bot
  activity: LocalActivity | undefined
  now: Date
  chrome: HomeChrome
  index: number
  onMenu: (key: HomeMenuKey, bot: Bot) => void
}

const HomeRow = ({ bot, activity, now, chrome, index, onMenu }: HomeRowProps) => {
  const [seen, setSeen] = useState<{ id: string; viewable: boolean } | null>(null)
  useViewability((token) => setSeen({ id: token.key, viewable: token.isViewable }))
  const viewable = seen?.id === bot.id ? seen.viewable : null
  const row = botRow(bot, activity, now)
  const actions = menuActions(bot, onMenu)
  const onPress = () => openChat(bot)
  return <BotHomeRow row={row} chrome={chrome} index={index} held={viewable === null ? index >= FIRST_SCREEN : !viewable} actions={actions} onPress={onPress} />
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
  const xl = useXlBoardText()
  const chrome = homeChrome(xl)
  const ios = Platform.OS === 'ios'
  const [searching, setSearching] = useState(false)
  const [text, setText] = useState('')
  const [q, setQ] = useState('')
  useEffect(() => {
    const t = text.trim()
    const id = setTimeout(() => setQ(t), t ? SEARCH_DEBOUNCE_MS : 0)
    return () => clearTimeout(id)
  }, [text])
  const [scrolled, setScrolled] = useState(false)
  const found = useBotSearch(q)
  const now = new Date()
  const home = splitHome(bots ?? [])
  const push = home.push ?? (fallbackPush?.kind === 'push' ? fallbackPush : undefined)
  const top = insets.top + chrome.header
  const lift = barLift(keyboard, ios)
  const screen = { flex: 1, backgroundColor: c.bg }
  const fade = {
    position: 'absolute' as const,
    left: 0,
    right: 0,
    bottom: keyboard > 0 && !ios ? lift : 0,
    height: ios ? 200 : 190,
    zIndex: 3,
  }
  const listPad = { paddingTop: top, paddingBottom: LIST_BOTTOM }
  const openMaterials = () => router.push(materialsPath())

  const run = (key: HomeMenuKey, bot: Bot) => {
    if (key === 'find') openChat(bot)
    if (key === 'read') onRead(bot)
    if (bot.kind !== 'company') return
    if (key === 'profile') router.push(botProfilePath(bot.id))
    if (key === 'mute') onMute(bot, !bot.muted)
    if (key === 'delete')
      confirmDeleteBot(bot.name, () => {
        void onDelete(bot)
          .then(() => onForget(bot.id))
          .catch(() => undefined)
      })
  }

  const renderItem = ({ item, index }: { item: Bot; index: number }) => <HomeRow bot={item} activity={local[item.id]} now={now} chrome={chrome} index={index} onMenu={run} />

  const hero = push ? (
    <BotHomeHero chrome={chrome} motion={rowMotion(0, false)} row={botRow(push, local[push.id], now)} actions={menuActions(push, run)} onPress={() => openChat(push)} />
  ) : null

  return (
    <XlBoardChrome>
      <View style={screen}>
        <BotHomeHeader
          chrome={chrome}
          topInset={insets.top}
          label={accountLabel(accountName, plan)}
          name={accountName}
          onAccount={() => router.push(accountPath())}
          onNew={() => void openBotNew()}
          scrolled={scrolled}
          hideNew={searching && !ios}
        />
        {searching ? (
          <BotHomeSearch
            query={q}
            hint={text.trim() === ''}
            data={found.data}
            pending={found.isLoading}
            local={local}
            now={now}
            chrome={chrome}
            top={insets.top + chrome.searchTop}
            bottom={lift + chrome.control}
            bots={bots ?? []}
            onOpenBot={openChat}
            onOpenMessage={(id, messageId) => router.push(botChatAtPath(id, messageId))}
          />
        ) : loading && !bots ? (
          <BotHomeLoading chrome={chrome} top={top} />
        ) : (
          <LegendList
            data={home.companies}
            keyExtractor={(bot) => bot.id}
            renderItem={renderItem}
            recycleItems
            estimatedItemSize={84}
            contentContainerStyle={listPad}
            keyboardDismissMode="on-drag"
            viewabilityConfig={VIEWABILITY}
            onScroll={(e) => setScrolled(e.nativeEvent.contentOffset.y > 0)}
            scrollEventThrottle={64}
            ListHeaderComponent={
              <View>
                {hero}
                {error && !bots ? <BotHomeError onRetry={onRetry} /> : null}
              </View>
            }
          />
        )}
        {ios && keyboard > 0 ? null : (
          <LinearGradient
            pointerEvents="none"
            colors={ios ? [`${c.bg}00`, `${c.bg}B3`, `${c.bg}EB`] : [`${c.bg}00`, c.bg, c.bg]}
            locations={ios ? [0, 0.45, 1] : [0, 0.42, 1]}
            style={fade}
          />
        )}
        <BotHomeBar
          chrome={chrome}
          lift={lift}
          searching={searching}
          query={text}
          onSearch={() => {
            setText('')
            setSearching(true)
          }}
          onMaterials={openMaterials}
          onChange={setText}
          onClose={() => {
            setText('')
            setSearching(false)
          }}
        />
      </View>
    </XlBoardChrome>
  )
}

export default BotHomeView
