import { router } from 'expo-router'
import { useState } from 'react'
import { Platform, Pressable, ScrollView, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Button, Icon, Mascot, SettingsGroup, SettingsRow, Skeleton, Switch, Text, TopBar, XL_ROW_HEIGHT, XL_ROW_LABEL } from '@/shared/components'
import { useXlBoardText, XlBoardChrome } from '@/shared/components/xl-chrome'
import { type } from '../../../../theme'
import { mascotPalette } from '../../../../theme/mascot'
import { useBot, useBotProfile, useBotSchedules, useBots, useDeleteBot, useSetBotMuted } from '../../api/hooks'
import { botAllowedPath, botColorPath, botCompaniesPath, botSchedulesPath, materialsPath } from '../../utils/paths'
import type { Bot, BotAddress } from '../../types'
import {
  COLOR_A11Y,
  PROFILE_ERROR_BODY,
  PROFILE_ERROR_TITLE,
  PROFILE_LOADING_LABEL,
  RETRY_LABEL,
  profileGroups,
  type ProfileRow,
} from './profile-rows'
import { companyNames } from './companies'
import { confirmDeleteBot } from './confirm-delete-bot'

const IOS = Platform.OS === 'ios'
const HEADER_MASCOT = 104
const COLOR_DOT = 22

const LOADING_GROUPS: readonly (readonly number[])[] = [[60, 80], [60], [40, 60], [80]]
const SKELETON_MASCOT_RADIUS = 36

const Loading = () => {
  return (
    <View style={styles.screen} accessibilityLabel={PROFILE_LOADING_LABEL}>
      <TopBar circleBack chat={IOS} onBack={() => router.back()} />
      <View style={styles.head}>
        <View style={styles.skeletonMascot}>
          <Skeleton width={HEADER_MASCOT} height={HEADER_MASCOT} radius={SKELETON_MASCOT_RADIUS} />
        </View>
        <Skeleton width={120} height={22} />
        <View style={styles.skeletonSub}>
          <Skeleton width={180} height={14} />
        </View>
      </View>
      {LOADING_GROUPS.map((widths, group) => (
        <View
          key={group}
          style={[styles.skeletonGroup, group > 0 && styles.groupGap]}
        >
          {widths.map((width, row) => (
            <View
              key={row}
              style={[styles.skeletonRow, row > 0 && styles.skeletonRowDivided]}
            >
              <Skeleton width={width} height={14} />
            </View>
          ))}
        </View>
      ))}
    </View>
  )
}

const ProfileHead = ({ name, color, sub }: { name: string; color: Parameters<typeof Mascot>[0]['color']; sub?: string }) => {
  const xl = useXlBoardText()
  const size = xl ? { mascot: 80, name: 28, nameLine: 36, sub: 17, subLine: 24 } : { mascot: HEADER_MASCOT, name: 22, nameLine: 30, sub: 13, subLine: 18 }
  return (
    <View style={styles.head}>
      <View style={styles.headMascot}>
        <Mascot size={size.mascot} color={color} motion={{ mode: 'still' }} />
      </View>
      <Text
        weight="800"
        numberOfLines={2}
        allowFontScaling={xl ? false : undefined}
        style={styles.name(size.name, size.nameLine)}
      >
        {name}
      </Text>
      {sub ? (
        <Text color="t3" numberOfLines={1} allowFontScaling={xl ? false : undefined} style={styles.sub(size.sub, size.subLine)}>
          {sub}
        </Text>
      ) : null}
    </View>
  )
}

const Failed = ({ bot, onRetry }: { bot: Bot | undefined; onRetry: () => void }) => {
  return (
    <View style={styles.screen}>
      <TopBar circleBack chat={IOS} onBack={() => router.back()} />
      {bot ? <ProfileHead name={bot.name} color={bot.kind === 'push' ? 'push' : bot.color} /> : null}
      <View
        accessibilityRole="alert"
        style={styles.failed}
      >
        <Text v="h3" accessibilityRole="header" style={styles.center}>
          {PROFILE_ERROR_TITLE}
        </Text>
        <Text v="b2" color="t3" style={styles.center}>
          {PROFILE_ERROR_BODY}
        </Text>
        <Button label={RETRY_LABEL} variant="secondary" size="sm" onPress={onRetry} style={styles.retry} />
      </View>
    </View>
  )
}

const BotProfileView = ({ address }: { address: BotAddress }) => {
  const profile = useBotProfile(address)
  const listed = useBot(address)
  const setMuted = useSetBotMuted()
  const remove = useDeleteBot()
  const companies = companyNames(useBots().data)
  const schedules = useBotSchedules(profile.data?.bot.id)
  const [deleting, setDeleting] = useState(false)
  const xl = useXlBoardText()
  if (profile.isLoading) return <Loading />
  if (profile.isError || !profile.data) return <Failed bot={listed.data} onRetry={() => void profile.refetch()} />
  const { bot, posting } = profile.data
  const color = bot.kind === 'push' ? 'push' : bot.color
  const groups = profileGroups({
    kind: bot.kind,
    posting: posting && { deadline: posting.deadline },
    fitScore: profile.data.fitScore,
    materialCount: profile.data.materialCount,
    companyCount: companies.length,
    allowedCount: profile.data.allowedSites?.length,
    scheduleCount: schedules.data?.length ?? null,
  })
  const open = (row: ProfileRow) => {
    if ((row.id === 'posting' || row.id === 'fit') && posting) router.push(`/postings/${posting.id}`)
    if (row.id === 'materials') router.push(materialsPath(bot.id))
    if (row.id === 'allowed') router.push(botAllowedPath(bot.id))
    if (row.id === 'companies') router.push(botCompaniesPath(bot.id))
    if (row.id === 'schedules') router.push(botSchedulesPath(bot.id))
    if (row.id === 'color' && bot.kind === 'company') router.push(botColorPath(bot.id))
    if (row.id === 'delete' && bot.kind === 'company') confirmDeleteBot(bot.name, () => void onDelete())
  }
  const onDelete = async () => {
    if (bot.kind !== 'company' || deleting) return
    setDeleting(true)
    try {
      await remove(bot)
      router.back()
    } catch {
      setDeleting(false)
    }
  }
  const rowOf = (row: ProfileRow) => {
    if (row.id === 'notify') {
      return (
        <SettingsRow key={row.id} xl={xl} label={row.label} right={<Switch value={!bot.muted} label={row.label} onValueChange={(on) => void setMuted(bot, !on)} />} />
      )
    }
    if (row.id === 'color' && bot.kind === 'company') {
      return (
        <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={COLOR_A11Y} onPress={() => open(row)}>
          <View
            style={[styles.colorRow, xl && styles.colorRowXl]}
          >
            <Text v="b1" allowFontScaling={xl ? false : undefined} style={[styles.colorLabel, xl ? styles.colorLabelXl : styles.colorLabelLine]}>
              {row.label}
            </Text>
            <View style={styles.colorTrail}>
              <View
                style={styles.colorDot(bot.color)}
              />
              <Icon name="chev" size={16} color="t3" />
            </View>
          </View>
        </Pressable>
      )
    }
    if (row.id === 'delete') {
      return <SettingsRow key={row.id} xl={xl} label={row.label} danger onPress={() => open(row)} right={<View />} />
    }
    if (row.id === 'posting' || row.id === 'fit' || row.id === 'materials' || row.id === 'allowed' || row.id === 'companies' || row.id === 'schedules') {
      const dead = row.id === 'fit' && !posting
      return <SettingsRow key={row.id} xl={xl} label={row.label} value={row.value} onPress={dead ? undefined : () => open(row)} chevron={dead} />
    }
    return null
  }
  return (
    <XlBoardChrome>
      <View style={styles.screen}>
        <TopBar circleBack chat={IOS} onBack={() => router.back()} />
        <ScrollView contentContainerStyle={styles.content}>
          <ProfileHead name={bot.name} color={color} sub={posting?.title} />
          {groups.map((group, index) => (
            <View key={group.map((row) => row.id).join('-')} style={[styles.group, index > 0 && styles.groupGap]}>
              <SettingsGroup>{group.map(rowOf)}</SettingsGroup>
            </View>
          ))}
        </ScrollView>
      </View>
    </XlBoardChrome>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  head: { alignItems: 'center', gap: theme.spacing[1], paddingTop: theme.spacing[1], paddingHorizontal: 28, paddingBottom: theme.spacing[5] },
  skeletonMascot: { marginBottom: 10 },
  skeletonSub: { marginTop: 6 },
  skeletonGroup: { marginHorizontal: theme.spacing[5], marginTop: 0, borderRadius: theme.radius.card, backgroundColor: theme.colors.bg2, paddingHorizontal: theme.spacing[4] },
  skeletonRow: { minHeight: 56, justifyContent: 'center', borderTopWidth: 0, borderTopColor: theme.colors.line },
  skeletonRowDivided: { borderTopWidth: 1 },
  headMascot: { marginBottom: 6 },
  name: (fontSize: number, lineHeight: number) => ({ textAlign: 'center', maxWidth: 330, fontSize, lineHeight }),
  sub: (fontSize: number, lineHeight: number) => ({ textAlign: 'center', fontSize, lineHeight }),
  failed: { alignItems: 'center', gap: theme.spacing[2], paddingHorizontal: 36, paddingTop: theme.spacing[6] },
  center: { textAlign: 'center' },
  retry: { marginTop: theme.spacing[3] },
  colorRow: { minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], paddingVertical: theme.spacing[2] },
  colorRowXl: { minHeight: XL_ROW_HEIGHT },
  colorLabel: { flex: 1 },
  colorLabelXl: { ...XL_ROW_LABEL },
  colorLabelLine: { lineHeight: type.b2.lineHeight },
  colorTrail: { flexDirection: 'row', alignItems: 'center', gap: 2 },
  colorDot: (color: Parameters<typeof mascotPalette>[0]) => ({ width: COLOR_DOT, height: COLOR_DOT, borderRadius: COLOR_DOT / 2, marginRight: theme.spacing[1], backgroundColor: mascotPalette(color, theme.mode).body }),
  content: { paddingBottom: theme.spacing[6] },
  group: { marginHorizontal: theme.spacing[5], marginTop: 0 },
  groupGap: { marginTop: theme.spacing[3] },
}))

export default BotProfileView
