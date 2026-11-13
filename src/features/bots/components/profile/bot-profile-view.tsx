import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Modal, Platform, Pressable, ScrollView, View, useWindowDimensions } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, GlassPressable, Icon, Mascot, SettingsGroup, SettingsRow, Skeleton, Switch, Text, TopBar, showToast } from '@/shared/components'
import { platformTheme, radius, spacing, type, useColors, useThemeMode } from '../../../../theme'
import { mascotPalette } from '../../../../theme/mascot'
import { useBot, useBotProfile, useDeleteBot, useSetBotMuted } from '../../api/hooks'
import { botColorPath, materialsPath } from '../../utils/paths'
import type { Bot, BotAddress, CompanyBot } from '../../types'
import {
  ALLOWED_SHEET_LABEL,
  CANCEL_LABEL,
  CLOSE_LABEL,
  COLOR_A11Y,
  DELETE_ACTION,
  DELETE_BODY,
  PROFILE_ERROR_BODY,
  PROFILE_ERROR_TITLE,
  PROFILE_LOADING_LABEL,
  RETRY_LABEL,
  REVOKE_LABEL,
  allowedSheetTitle,
  deleteTitle,
  grantIntro,
  grantMeta,
  profileGroups,
  revokeA11y,
  revokeToast,
  type ProfileRow,
} from './profile-rows'
import BotDeleteSheet from './bot-delete-sheet'
import { SheetCard } from './sheet-card'
import { useRevokeSiteGrant, useSiteGrants } from './use-site-grants'

const HEADER_MASCOT = 104
const XL_SCALE = 1.5
const COLOR_DOT = 22

const LOADING_GROUPS: readonly (readonly number[])[] = [[60, 80], [60], [40, 60], [80]]
const SKELETON_MASCOT_RADIUS = 36

const Loading = () => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityLabel={PROFILE_LOADING_LABEL}>
      <TopBar onBack={() => router.back()} />
      <View
        style={{
          alignItems: 'center',
          gap: spacing[1],
          paddingTop: spacing[1],
          paddingHorizontal: 28,
          paddingBottom: spacing[5],
        }}
      >
        <View style={{ marginBottom: 10 }}>
          <Skeleton width={HEADER_MASCOT} height={HEADER_MASCOT} radius={SKELETON_MASCOT_RADIUS} />
        </View>
        <Skeleton width={120} height={22} />
        <View style={{ marginTop: 6 }}>
          <Skeleton width={180} height={14} />
        </View>
      </View>
      {LOADING_GROUPS.map((widths, group) => (
        <View
          key={group}
          style={{
            marginHorizontal: spacing[5],
            marginTop: group > 0 ? spacing[3] : 0,
            borderRadius: radius.card,
            backgroundColor: c.bg2,
            paddingHorizontal: spacing[4],
          }}
        >
          {widths.map((width, row) => (
            <View
              key={row}
              style={{
                minHeight: 56,
                justifyContent: 'center',
                borderTopWidth: row > 0 ? 1 : 0,
                borderTopColor: c.line,
              }}
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
  const xl = useWindowDimensions().fontScale >= XL_SCALE
  const size = xl ? { mascot: 80, name: 28, nameLine: 36, sub: 17, subLine: 24 } : { mascot: HEADER_MASCOT, name: 22, nameLine: 30, sub: 13, subLine: 18 }
  return (
    <View
      style={{
        alignItems: 'center',
        gap: spacing[1],
        paddingTop: spacing[1],
        paddingHorizontal: 28,
        paddingBottom: spacing[5],
      }}
    >
      <View style={{ marginBottom: 6 }}>
        <Mascot size={size.mascot} color={color} motion={{ mode: 'still' }} />
      </View>
      <Text
        weight="800"
        numberOfLines={2}
        style={{
          textAlign: 'center',
          maxWidth: 330,
          fontSize: size.name,
          lineHeight: size.nameLine,
        }}
      >
        {name}
      </Text>
      {sub ? (
        <Text color="t3" numberOfLines={1} style={{ textAlign: 'center', fontSize: size.sub, lineHeight: size.subLine }}>
          {sub}
        </Text>
      ) : null}
    </View>
  )
}

const Failed = ({ bot, onRetry }: { bot: Bot | undefined; onRetry: () => void }) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      {bot ? <ProfileHead name={bot.name} color={bot.kind === 'push' ? 'push' : bot.color} /> : null}
      <View
        accessibilityRole="alert"
        style={{
          alignItems: 'center',
          gap: spacing[2],
          paddingHorizontal: 36,
          paddingTop: spacing[6],
        }}
      >
        <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {PROFILE_ERROR_TITLE}
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {PROFILE_ERROR_BODY}
        </Text>
        <Button label={RETRY_LABEL} variant="secondary" size="sm" onPress={onRetry} style={{ marginTop: spacing[3] }} />
      </View>
    </View>
  )
}

const BotProfileView = ({ address }: { address: BotAddress }) => {
  const c = useColors()
  const mode = useThemeMode()
  const profile = useBotProfile(address)
  const listed = useBot(address)
  const { grants, count } = useSiteGrants(address)
  const revoke = useRevokeSiteGrant(address)
  const setMuted = useSetBotMuted()
  const remove = useDeleteBot()
  const [sheet, setSheet] = useState<'allowed' | 'delete' | null>(null)
  const [deleting, setDeleting] = useState(false)
  if (profile.isLoading) return <Loading />
  if (profile.isError || !profile.data) return <Failed bot={listed.data} onRetry={() => void profile.refetch()} />
  const { bot, posting } = profile.data
  const color = bot.kind === 'push' ? 'push' : bot.color
  const groups = profileGroups({
    kind: bot.kind,
    posting: posting && { deadline: posting.deadline },
    fitScore: profile.data.fitScore,
    materialCount: profile.data.materialCount,
    grantCount: count,
  })
  const open = (row: ProfileRow) => {
    if ((row.id === 'posting' || row.id === 'fit') && posting) router.push(`/postings/${posting.id}`)
    if (row.id === 'materials') router.push(materialsPath(bot.id))
    if (row.id === 'allowed') setSheet('allowed')
    if (row.id === 'color' && bot.kind === 'company') router.push(botColorPath(bot.id))
    if (row.id === 'delete') setSheet('delete')
  }
  const onRevoke = async (host: string) => {
    const left = grants.filter((grant) => grant.host !== host).length
    try {
      await revoke.mutateAsync(host)
    } catch {
      return
    }
    showToast({ message: revokeToast(host), tone: 'success' })
    if (left === 0) setSheet(null)
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
        <SettingsRow key={row.id} label={row.label} right={<Switch value={!bot.muted} label={row.label} onValueChange={(on) => void setMuted(bot, !on)} />} />
      )
    }
    if (row.id === 'color' && bot.kind === 'company') {
      return (
        <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={COLOR_A11Y} onPress={() => open(row)}>
          <View
            style={{
              minHeight: 56,
              flexDirection: 'row',
              alignItems: 'center',
              gap: spacing[3],
              paddingVertical: spacing[2],
            }}
          >
            <Text v="b1" style={{ flex: 1, lineHeight: type.b2.lineHeight }}>
              {row.label}
            </Text>
            <View style={{ flexDirection: 'row', alignItems: 'center', gap: 2 }}>
              <View
                style={{
                  width: COLOR_DOT,
                  height: COLOR_DOT,
                  borderRadius: COLOR_DOT / 2,
                  marginRight: spacing[1],
                  backgroundColor: mascotPalette(bot.color, mode).body,
                }}
              />
              <Icon name="chev" size={16} color="t3" />
            </View>
          </View>
        </Pressable>
      )
    }
    if (row.id === 'delete') {
      return <SettingsRow key={row.id} label={row.label} danger onPress={() => open(row)} right={<View />} />
    }
    if (row.id === 'posting' || row.id === 'fit' || row.id === 'materials' || row.id === 'allowed') {
      const dead = row.id === 'fit' && !posting
      return <SettingsRow key={row.id} label={row.label} value={row.value} onPress={dead ? undefined : () => open(row)} chevron={dead} />
    }
    return null
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingBottom: spacing[6] }}>
        <ProfileHead name={bot.name} color={color} sub={posting?.title} />
        {groups.map((group, index) => (
          <View key={group.map((row) => row.id).join('-')} style={{ marginHorizontal: spacing[5], marginTop: index > 0 ? spacing[3] : 0 }}>
            <SettingsGroup>{group.map(rowOf)}</SettingsGroup>
          </View>
        ))}
      </ScrollView>
      {sheet === 'allowed' ? (
        <SheetCard label={ALLOWED_SHEET_LABEL} title={allowedSheetTitle(grants.length)} onClose={() => setSheet(null)}>
          <Text v="b2" color="t2">
            {grantIntro(bot)}
          </Text>
          <View style={{ marginTop: spacing[2] }}>
            {grants.map((grant) => (
              <View
                key={grant.host}
                style={{
                  flexDirection: 'row',
                  alignItems: 'center',
                  gap: spacing[3],
                  minHeight: 64,
                  borderTopWidth: 1,
                  borderTopColor: c.line,
                }}
              >
                <View style={{ flex: 1, gap: 2 }}>
                  <Text v="b1" weight="600" numberOfLines={1}>
                    {grant.host}
                  </Text>
                  <Text v="c1" color="t3">
                    {grantMeta(grant.grantedAt, grant.kind)}
                  </Text>
                </View>
                <GlassPressable
                  accessibilityRole="button"
                  accessibilityLabel={revokeA11y(grant.host)}
                  disabled={revoke.isPending}
                  onPress={() => void onRevoke(grant.host)}
                  glass
                  fill="fill"
                  style={{ minHeight: 40, borderRadius: platformTheme.buttonSmRadius }}
                  contentStyle={{ paddingHorizontal: 14 }}
                >
                  <Text v="c1" weight="700">
                    {REVOKE_LABEL}
                  </Text>
                </GlassPressable>
              </View>
            ))}
          </View>
          <Button label={CLOSE_LABEL} variant="secondary" onPress={() => setSheet(null)} style={{ marginTop: spacing[2] }} />
        </SheetCard>
      ) : null}
      {sheet === 'delete' && bot.kind === 'company' ? (
        <BotDeleteSheet bot={bot} disabled={deleting} onClose={() => setSheet(null)} onDelete={() => void onDelete()} />
      ) : null}
    </View>
  )
}

export default BotProfileView
