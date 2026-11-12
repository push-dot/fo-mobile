import { router } from 'expo-router'
import { useState, type ReactNode } from 'react'
import { Modal, Pressable, ScrollView, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { Button, GlassPressable, Icon, Mascot, SettingsGroup, SettingsRow, Skeleton, Switch, Text, TopBar, showToast } from '@/shared/components'
import { radius, spacing, type, useColors, useThemeMode } from '../../../../theme'
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
import { useRevokeSiteGrant, useSiteGrants } from './use-site-grants'

const HEADER_MASCOT = 104
const DELETE_MASCOT = 32
const COLOR_DOT = 22

const Loading = () => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }} accessibilityLabel={PROFILE_LOADING_LABEL}>
      <TopBar onBack={() => router.back()} />
      <View style={{ alignItems: 'center', gap: spacing[3], padding: spacing[6] }}>
        <Skeleton width={HEADER_MASCOT} height={HEADER_MASCOT} radius={HEADER_MASCOT / 2} />
        <Skeleton width={120} height={20} />
        <Skeleton width={88} height={14} />
      </View>
      <View style={{ gap: spacing[3], paddingHorizontal: spacing[5] }}>
        {[0, 1, 2, 3].map((key) => (
          <Skeleton key={key} width="100%" height={56} />
        ))}
      </View>
    </View>
  )
}

const Failed = ({ bot, onRetry }: { bot: Bot | undefined; onRetry: () => void }) => {
  const c = useColors()
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      {bot ? (
        <View style={{ alignItems: 'center', paddingBottom: 22 }}>
          <Mascot size={HEADER_MASCOT} color={bot.kind === 'push' ? 'push' : bot.color} motion={{ mode: 'still' }} />
          <Text v="h2" weight="800" numberOfLines={2} style={{ textAlign: 'center' }}>
            {bot.name}
          </Text>
        </View>
      ) : null}
      <View accessibilityRole="alert" style={{ alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[5], paddingTop: spacing[6] }}>
        <Text v="h3" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {PROFILE_ERROR_TITLE}
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {PROFILE_ERROR_BODY}
        </Text>
        <Button label={RETRY_LABEL} variant="secondary" size="sm" onPress={onRetry} />
      </View>
    </View>
  )
}

const SheetCard = ({ label, title, onClose, children }: { label: string; title?: string; onClose: () => void; children: ReactNode }) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  return (
    <Modal visible transparent animationType="slide" onRequestClose={onClose} statusBarTranslucent>
      <Pressable onPress={onClose} style={{ flex: 1, justifyContent: 'flex-end', backgroundColor: c.scrim }}>
        <Pressable accessible={false} accessibilityLabel={label} onPress={() => undefined} style={{ backgroundColor: c.bg, borderTopLeftRadius: radius.sheetTop, borderTopRightRadius: radius.sheetTop, paddingHorizontal: spacing[4], paddingTop: spacing[3], paddingBottom: insets.bottom + spacing[4], gap: spacing[2] }}>
          <View style={{ width: 36, height: 5, borderRadius: 3, backgroundColor: c.deco, alignSelf: 'center' }} />
          {title ? (
            <Text v="h3" accessibilityRole="header">
              {title}
            </Text>
          ) : null}
          {children}
        </Pressable>
      </Pressable>
    </Modal>
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
        <SettingsRow
          key={row.id}
          label={row.label}
          right={<Switch value={!bot.muted} label={row.label} onValueChange={(on) => void setMuted(bot, !on)} />}
        />
      )
    }
    if (row.id === 'color' && bot.kind === 'company') {
      return (
        <Pressable key={row.id} accessibilityRole="button" accessibilityLabel={COLOR_A11Y} onPress={() => open(row)}>
          <View style={{ minHeight: 56, flexDirection: 'row', alignItems: 'center', gap: spacing[3], paddingVertical: spacing[2] }}>
            <Text v="b1" style={{ flex: 1, lineHeight: type.b2.lineHeight }}>
              {row.label}
            </Text>
            <View style={{ width: COLOR_DOT, height: COLOR_DOT, borderRadius: COLOR_DOT / 2, backgroundColor: mascotPalette(bot.color, mode).body }} />
            <Icon name="chev" size={18} color="t4" />
          </View>
        </Pressable>
      )
    }
    if (row.id === 'delete') {
      return <SettingsRow key={row.id} label={row.label} danger onPress={() => open(row)} right={<View />} />
    }
    if (row.id === 'posting' || row.id === 'fit' || row.id === 'materials' || row.id === 'allowed') {
      const dead = row.id === 'fit' && !posting
      return (
        <SettingsRow
          key={row.id}
          label={row.label}
          value={row.value}
          onPress={dead ? undefined : () => open(row)}
        />
      )
    }
    return null
  }
  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <ScrollView contentContainerStyle={{ paddingHorizontal: spacing[5], paddingBottom: spacing[6], gap: spacing[3] }}>
        <View style={{ alignItems: 'center', gap: spacing[1], paddingHorizontal: spacing[2], paddingBottom: 22 }}>
          <Mascot size={HEADER_MASCOT} color={color} motion={{ mode: 'still' }} />
          <Text v="h2" weight="800" numberOfLines={2} style={{ textAlign: 'center' }}>
            {bot.name}
          </Text>
          {posting ? (
            <Text v="c1" color="t3" numberOfLines={1} style={{ textAlign: 'center' }}>
              {posting.title}
            </Text>
          ) : null}
        </View>
        {groups.map((group) => (
          <SettingsGroup key={group.map((row) => row.id).join('-')}>{group.map(rowOf)}</SettingsGroup>
        ))}
      </ScrollView>
      {sheet === 'allowed' ? (
        <SheetCard label={ALLOWED_SHEET_LABEL} title={allowedSheetTitle(grants.length)} onClose={() => setSheet(null)}>
          <Text v="b2" color="t2">
            {grantIntro(bot)}
          </Text>
          <View>
            {grants.map((grant) => (
              <View key={grant.host} style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], minHeight: 64, borderTopWidth: 1, borderTopColor: c.line }}>
                <View style={{ flex: 1, gap: 2 }}>
                  <Text v="b1" weight="600" numberOfLines={1} style={{ lineHeight: type.b2.lineHeight }}>
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
                  style={{ minHeight: 40, borderRadius: radius.buttonSmIos }}
                  contentStyle={{ paddingHorizontal: spacing[4] }}
                >
                  <Text v="c1" weight="700">
                    {REVOKE_LABEL}
                  </Text>
                </GlassPressable>
              </View>
            ))}
          </View>
          <Button label={CLOSE_LABEL} variant="secondary" onPress={() => setSheet(null)} />
        </SheetCard>
      ) : null}
      {sheet === 'delete' && bot.kind === 'company' ? (
        <DeleteSheet bot={bot} disabled={deleting} onClose={() => setSheet(null)} onDelete={() => void onDelete()} />
      ) : null}
    </View>
  )
}

const DeleteSheet = ({ bot, disabled, onClose, onDelete }: { bot: CompanyBot; disabled: boolean; onClose: () => void; onDelete: () => void }) => (
  <SheetCard label={deleteTitle(bot.name)} onClose={onClose}>
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
      <Mascot size={DELETE_MASCOT} color={bot.color} motion={{ mode: 'still' }} />
      <Text v="h3" accessibilityRole="header" style={{ flex: 1 }}>
        {deleteTitle(bot.name)}
      </Text>
    </View>
    <Text v="b2" color="t2">
      {DELETE_BODY}
    </Text>
    <View style={{ flexDirection: 'row', gap: spacing[2], marginTop: spacing[3] }}>
      <Button label={CANCEL_LABEL} variant="secondary" onPress={onClose} style={{ flex: 1 }} />
      <Button label={DELETE_ACTION} variant="danger" disabled={disabled} onPress={onDelete} style={{ flex: 1 }} />
    </View>
  </SheetCard>
)

export default BotProfileView
