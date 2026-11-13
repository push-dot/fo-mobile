import { useEffect, useRef, useState } from 'react'
import { KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError } from '@push/api-client'
import { useReferenceConsent } from '@/features/my'
import { Button, GlassButton, GlassPressable, Icon, Mascot, Skeleton, Spinner, Text } from '@/shared/components'
import { fontFor, onAccent, platformTheme, radius, spacing, useColors, type } from '@/theme'
import { MASCOT_PALETTES } from '@/theme/mascot'
import { botErrorKind } from '../../api/errors'
import { checkLink, findBotForPosting } from '../../api/fetchers'
import { useBots, useCreateBot } from '../../api/hooks'
import { BOT_COLORS } from '../../constants'
import type { BotColor, BotId, BotLimit } from '../../types'
import {
  asLink,
  beginCreate,
  chooseColor,
  clearPosting,
  closeSearch,
  dismissConsent,
  failCreate,
  focusSearch,
  initialForm,
  limitCopy,
  linkFailed,
  linkFound,
  linkLabel,
  linkMissing,
  linkStatus,
  markFinding,
  onPostingChosen,
  pickPosting,
  postingMeta,
  retryCreate,
  setQuery,
  startLinkCheck,
  submitCreate,
  type CreateForm,
  type PostingPick,
} from '../../utils/create-form'
import {
  CLOSE_LABEL,
  CONSENT_AGREE,
  CONSENT_BODY,
  CONSENT_FOOT,
  CONSENT_LATER,
  CONSENT_MORE,
  CONSENT_TITLE,
  CREATE_LABEL,
  CREATING_LABEL,
  CURRENT_PLAN,
  ERROR_BODY,
  ERROR_TITLE,
  LINK_BAD,
  LINK_FINDING_AFTER_MS,
  LINK_FOUND_SECTION,
  LINK_SECTION,
  NAME_PLACEHOLDER,
  ORGANIZE_LABEL,
  RETRY_LABEL,
  SEARCH_CLOSE,
  SEARCH_DEBOUNCE_MS,
  SEARCH_EMPTY,
  SEARCH_HINT,
  SEARCH_PLACEHOLDER,
  SHEET_TITLE,
  UPGRADE_LABEL,
  XL_FONT_SCALE,
} from './copy'
import { loadPosting, searchPostings, type PostingRow } from './posting-search'

type Props = {
  postingId?: string
  onClose: () => void
  onOpenBot: (id: BotId) => void
  onUpgrade: () => void
}

const SWATCH = 46
const DOT = 34
const PREVIEW = 120
const FIELD = 44
const FIELD_XL = 52
const CTA = 56
const CTA_XL = 64
const CTA_FONT_XL = 21

const isConsentRequired = (error: unknown) => error instanceof ApiError && error.status === 403 && error.code === 'CONSENT_REQUIRED'

const pickedLine = (posting: PostingPick) => `${posting.company} · ${posting.title}`

const searchPhase = (form: CreateForm) =>
  form.phase.kind === 'searching' ||
  form.phase.kind === 'linkChecking' ||
  form.phase.kind === 'linkFinding' ||
  form.phase.kind === 'linkRetry' ||
  form.phase.kind === 'linkOk' ||
  form.phase.kind === 'linkBad'

const fieldValue = (form: CreateForm) => {
  if (form.phase.kind === 'searching') return form.phase.query
  if (
    form.phase.kind === 'linkChecking' ||
    form.phase.kind === 'linkFinding' ||
    form.phase.kind === 'linkRetry' ||
    form.phase.kind === 'linkOk' ||
    form.phase.kind === 'linkBad'
  )
    return linkLabel(form.phase.url)
  if ('posting' in form.phase) return pickedLine(form.phase.posting)
  return ''
}

const Highlight = ({ text, query }: { text: string; query: string }) => {
  const needle = query.trim()
  const at = needle ? text.toLowerCase().indexOf(needle.toLowerCase()) : -1
  if (at < 0) {
    return (
      <Text v="b1" weight="600" style={{ lineHeight: type.b2.lineHeight }}>
        {text}
      </Text>
    )
  }
  return (
    <Text v="b1" weight="600" style={{ lineHeight: type.b2.lineHeight }}>
      {text.slice(0, at)}
      <Text v="b1" weight="700" color="acText" style={{ lineHeight: type.b2.lineHeight }}>
        {text.slice(at, at + needle.length)}
      </Text>
      {text.slice(at + needle.length)}
    </Text>
  )
}

const Cta = ({ label, onPress, busy, enabled, xl, icon }: { label: string; onPress: () => void; busy?: boolean; enabled: boolean; xl: boolean; icon?: 'retry' }) => {
  const c = useColors()
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled || !!busy, busy: !!busy }}
      glass={false}
      fill={enabled ? 'ac' : 'fill2'}
      pressedFill="acPress"
      onPress={!enabled || busy ? undefined : onPress}
      contentStyle={icon ? { gap: spacing[2] } : undefined}
      style={{ minHeight: xl ? CTA_XL : CTA, borderRadius: platformTheme.buttonRadius }}
    >
      {busy ? <Spinner size={18} color="onFill" /> : null}
      {!busy && icon ? <Icon name={icon} size={18} color={enabled ? 'onFill' : 't3'} /> : null}
      <Text weight="700" allowFontScaling={!xl} style={{ color: enabled ? onAccent : c.t3, fontSize: xl ? CTA_FONT_XL : type.button.fontSize, lineHeight: xl ? 30 : type.button.lineHeight }}>
        {label}
      </Text>
    </GlassPressable>
  )
}

const Swatch = ({ name, on, onPick }: { name: BotColor; on: boolean; onPick: (next: BotColor) => void }) => {
  const c = useColors()
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: on }} onPress={() => onPick(name)} style={{ width: SWATCH, height: SWATCH, borderRadius: SWATCH / 2, alignItems: 'center', justifyContent: 'center', borderWidth: on ? 3 : 0, borderColor: c.t1 }}>
      <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: MASCOT_PALETTES[name].body }} />
    </Pressable>
  )
}

const Swatches = ({ color, onPick }: { color: BotColor; onPick: (next: BotColor) => void }) => (
  <View style={{ alignItems: 'center', gap: spacing[2] }}>
    <View style={{ flexDirection: 'row', gap: spacing[1] }}>
      {BOT_COLORS.slice(0, 7).map((name) => (
        <Swatch key={name} name={name} on={name === color} onPick={onPick} />
      ))}
    </View>
    <View style={{ flexDirection: 'row', gap: spacing[1] }}>
      {BOT_COLORS.slice(7).map((name) => (
        <Swatch key={name} name={name} on={name === color} onPick={onPick} />
      ))}
    </View>
  </View>
)

const LIMIT_MASCOTS = ['teal', 'amber', 'pink'] as const
const PLAN_ROW = 56

const LimitBody = ({ limit, onUpgrade, onClose }: { limit: BotLimit | undefined; onUpgrade: () => void; onClose: () => void }) => {
  const c = useColors()
  const copy = limit ? limitCopy(limit) : null
  return (
    <View style={{ gap: spacing[5] }}>
      <View style={{ flexDirection: 'row', justifyContent: 'center', gap: spacing[2] }}>
        {LIMIT_MASCOTS.map((color) => (
          <Mascot key={color} size={48} color={color} motion={{ mode: 'still' }} />
        ))}
      </View>
      {copy ? (
        <View style={{ gap: spacing[2] }}>
          <Text v="h2" accessibilityRole="header">
            {copy.title}
          </Text>
          <Text v="b2" color="t3">
            {copy.body}
          </Text>
        </View>
      ) : null}
      {copy ? (
        <View style={{ backgroundColor: c.fill, borderRadius: radius.lg, overflow: 'hidden' }}>
          {copy.rows.map((row) => (
            <View key={row.plan} style={{ minHeight: PLAN_ROW, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', paddingHorizontal: spacing[4], borderBottomWidth: 1, borderBottomColor: c.line }}>
              <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                <Text weight="700">{row.plan}</Text>
                {row.current ? (
                  <View style={{ backgroundColor: c.acSoft, borderRadius: 8, paddingHorizontal: spacing[2], paddingVertical: 2 }}>
                    <Text v="c2" weight="700" color="acText">
                      {CURRENT_PLAN}
                    </Text>
                  </View>
                ) : null}
              </View>
              <Text weight="700">{row.value}</Text>
            </View>
          ))}
        </View>
      ) : null}
      {copy ? (
        <Text v="c2" color="t3">
          {copy.note}
        </Text>
      ) : null}
      <View style={{ gap: spacing[2], marginTop: 'auto' }}>
        <Button label={UPGRADE_LABEL} onPress={onUpgrade} />
        <Button label={ORGANIZE_LABEL} variant="secondary" onPress={onClose} />
      </View>
    </View>
  )
}

const ConsentOverlay = ({ saving, onAgree, onLater }: { saving: boolean; onAgree: () => void; onLater: () => void }) => {
  const c = useColors()
  return (
    <View style={{ position: 'absolute', top: 0, right: 0, bottom: 0, left: 0, backgroundColor: c.scrim, justifyContent: 'flex-end', padding: spacing[4] }}>
      <View style={{ backgroundColor: c.bg, borderRadius: radius.xl, padding: spacing[5], gap: spacing[3] }}>
        <Text v="h2" accessibilityRole="header">
          {CONSENT_TITLE}
        </Text>
        <Text v="b2" color="t2">
          {CONSENT_BODY}
        </Text>
        <Text v="c1" weight="600" color="acText" style={{ textDecorationLine: 'underline' }}>
          {CONSENT_MORE}
        </Text>
        <Button label={CONSENT_AGREE} disabled={saving} onPress={onAgree} />
        <Button label={CONSENT_LATER} variant="secondary" onPress={onLater} />
        <Text v="c1" color="t3" style={{ textAlign: 'center' }}>
          {CONSENT_FOOT}
        </Text>
      </View>
    </View>
  )
}

const BotNewSheet = ({ postingId, onClose, onOpenBot, onUpgrade }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const xl = useWindowDimensions().fontScale >= XL_FONT_SCALE
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState<PostingRow[]>([])
  const [loading, setLoading] = useState(false)
  const bots = useBots()
  const consent = useReferenceConsent()
  const { create } = useCreateBot()
  const openRef = useRef(onOpenBot)
  useEffect(() => {
    openRef.current = onOpenBot
  }, [onOpenBot])
  const phase = form.phase
  const searching = searchPhase(form)
  const posting = 'posting' in phase ? phase.posting : null
  const query = phase.kind === 'searching' ? phase.query : ''

  useEffect(() => {
    if (!postingId) return
    let cancel = false
    void (async () => {
      const existing = await findBotForPosting(postingId).catch(() => null)
      if (cancel) return
      if (existing) {
        openRef.current(existing.id)
        return
      }
      const posting = await loadPosting(postingId)
      if (cancel || !posting) return
      setForm((current) => (current.phase.kind === 'idle' ? pickPosting(current, posting) : current))
    })()
    return () => {
      cancel = true
    }
  }, [postingId])

  useEffect(() => {
    if (phase.kind !== 'searching') return
    const q = phase.query.trim()
    if (!q || asLink(q)) return
    let cancel = false
    const timer = setTimeout(() => {
      setLoading(true)
      void searchPostings(q)
        .then((next) => {
          if (!cancel) setRows(next)
        })
        .catch(() => {
          if (!cancel) setRows([])
        })
        .finally(() => {
          if (!cancel) setLoading(false)
        })
    }, SEARCH_DEBOUNCE_MS)
    return () => {
      cancel = true
      clearTimeout(timer)
    }
  }, [phase])

  useEffect(() => {
    if (phase.kind !== 'searching') return
    const url = asLink(phase.query)
    if (!url) return
    const timer = setTimeout(() => {
      setForm((current) => (current.phase.kind === 'searching' && asLink(current.phase.query) === url ? startLinkCheck(current, url) : current))
    }, SEARCH_DEBOUNCE_MS)
    return () => clearTimeout(timer)
  }, [phase])

  const linkUrl = phase.kind === 'linkChecking' || phase.kind === 'linkFinding' ? phase.url : null

  useEffect(() => {
    if (!linkUrl) return
    let cancel = false
    void checkLink(linkUrl)
      .then((result) => {
        if (cancel) return
        if (result.status === 'not_a_posting') {
          setForm((current) => linkMissing(current))
          return
        }
        setForm((current) =>
          linkFound(current, {
            postingId: result.postingId,
            company: result.company,
            title: result.title,
            host: result.host,
            meta: postingMeta(
              { deadline: result.deadline, careerMin: result.careerMin, careerMax: result.careerMax, location: result.location },
              { location: true },
            ),
          }),
        )
      })
      .catch(() => {
        if (!cancel) setForm((current) => linkFailed(current))
      })
    return () => {
      cancel = true
    }
  }, [linkUrl])

  useEffect(() => {
    if (phase.kind !== 'linkChecking') return
    const timer = setTimeout(() => setForm((current) => markFinding(current)), LINK_FINDING_AFTER_MS)
    return () => clearTimeout(timer)
  }, [phase])

  const run = async (base: CreateForm) => {
    const action = base.phase.kind === 'error' ? retryCreate(base) : submitCreate(dismissConsent(base))
    if (action.action !== 'create') return
    setForm(beginCreate(base))
    try {
      const result = await create({ postingId: action.posting.postingId, color: action.color })
      openRef.current(result.bot.id)
    } catch (error) {
      if (isConsentRequired(error)) setForm(failCreate(base, 'consent'))
      else if (botErrorKind(error) === 'limit') setForm(failCreate(base, 'limit'))
      else setForm(failCreate(base, 'error'))
    }
  }

  const onCreate = () => {
    void run(form)
  }

  const choose = async (row: PostingPick) => {
    const existing = await findBotForPosting(row.postingId).catch(() => null)
    const choice = onPostingChosen(existing, row)
    if (choice.type === 'open' && existing) openRef.current(existing.id)
    else setForm((current) => pickPosting(current, row))
  }

  const onType = (text: string) => {
    setLoading(text.trim() !== '' && asLink(text) === null)
    setForm((current) => setQuery(current.phase.kind === 'searching' ? current : focusSearch(current), text))
  }

  const name = posting?.company
  const linkWait = phase.kind === 'linkChecking' || phase.kind === 'linkFinding'

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === 'ios' ? 'padding' : undefined}>
        <ScrollView keyboardShouldPersistTaps="handled" contentContainerStyle={{ flexGrow: 1, paddingTop: insets.top + spacing[3], paddingBottom: insets.bottom + spacing[4], paddingHorizontal: spacing[4], gap: spacing[5] }}>
          <View style={{ flexDirection: 'row', alignItems: 'center' }}>
            {searching ? <View style={{ width: 44 }} /> : <GlassButton actions={[{ icon: 'x', label: CLOSE_LABEL, onPress: onClose }]} />}
            <Text v="h3" accessibilityRole="header" allowFontScaling={!xl} style={[{ flex: 1, textAlign: 'center' }, xl ? { fontSize: 22, lineHeight: 30 } : null]}>
              {SHEET_TITLE}
            </Text>
            <View style={{ width: 44 }} />
          </View>
          {phase.kind === 'limit' ? (
            <LimitBody limit={bots.limit} onUpgrade={onUpgrade} onClose={onClose} />
          ) : (
            <View style={{ gap: spacing[5], flexGrow: 1 }}>
              {searching ? null : (
                <View style={{ alignItems: 'center', gap: spacing[2] }}>
                  <Mascot size={PREVIEW} color={form.color} state={phase.kind === 'creating' ? 'work' : 'idle'} motion={{ mode: 'still' }} />
                  <Text weight={name ? '800' : '700'} color={name ? 't1' : 't3'} numberOfLines={2} style={{ fontSize: 24, lineHeight: 32, textAlign: 'center' }}>
                    {name ?? NAME_PLACEHOLDER}
                  </Text>
                  {posting ? (
                    <Text v="b2" color="t2" numberOfLines={2} style={{ textAlign: 'center' }}>
                      {posting.title}
                    </Text>
                  ) : null}
                  <Swatches color={form.color} onPick={(next) => setForm((current) => chooseColor(current, next))} />
                </View>
              )}
              {phase.kind === 'idle' ? (
                <Pressable accessibilityRole="button" accessibilityLabel={SEARCH_PLACEHOLDER} onPress={() => setForm(focusSearch)}>
                  <View style={{ minHeight: xl ? FIELD_XL : FIELD, borderRadius: xl ? 26 : 22, backgroundColor: c.fill, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                    <Icon name="search" size={18} color="t3" />
                    <Text v="b1" color="t3" style={{ flex: 1 }}>
                      {SEARCH_PLACEHOLDER}
                    </Text>
                  </View>
                </Pressable>
              ) : null}
              {!searching && phase.kind !== 'idle' ? (
                <View style={{ minHeight: xl ? FIELD_XL : FIELD, borderRadius: xl ? 26 : 22, backgroundColor: c.fill, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  <Icon name="search" size={18} color="t3" />
                  <Pressable accessibilityRole="button" accessibilityLabel={pickedLine(posting!)} onPress={phase.kind === 'creating' ? undefined : () => setForm(focusSearch)} style={{ flex: 1 }}>
                    <Text v="b1" numberOfLines={1} style={{ fontSize: xl ? 19 : undefined }}>
                      {pickedLine(posting!)}
                    </Text>
                  </Pressable>
                  {phase.kind === 'creating' ? null : (
                    <Pressable accessibilityLabel="지우기" onPress={() => setForm(clearPosting)} hitSlop={8}>
                      <Icon name="x" size={16} color="t3" />
                    </Pressable>
                  )}
                </View>
              ) : null}
              {phase.kind === 'searching' && !query ? (
                <Text v="b2" color="t3" style={{ textAlign: 'center', paddingHorizontal: spacing[5] }}>
                  {SEARCH_HINT}
                </Text>
              ) : null}
              {phase.kind === 'searching' && query && !asLink(query) && !loading && rows.length === 0 ? (
                <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
                  {SEARCH_EMPTY}
                </Text>
              ) : null}
              {phase.kind === 'searching' && query && !asLink(query)
                ? rows.map((row) => (
                    <Pressable key={row.postingId} accessibilityRole="button" onPress={() => void choose(row)} style={{ minHeight: 60, justifyContent: 'center', gap: 2, borderBottomWidth: 1, borderBottomColor: c.line }}>
                      <Highlight text={pickedLine(row)} query={query} />
                      <Text v="c1" color="t3">
                        {row.meta}
                      </Text>
                    </Pressable>
                  ))
                : null}
              {linkWait ? (
                <View style={{ gap: spacing[2] }}>
                  <Text v="c1" weight="700" color="t3">
                    {LINK_SECTION}
                  </Text>
                  <Text v="b2" color="t2">
                    {linkStatus(form)}
                  </Text>
                  <Skeleton width="70%" height={12} radius={6} />
                  <Skeleton width="45%" height={12} radius={6} />
                </View>
              ) : null}
              {phase.kind === 'linkBad' ? (
                <Text v="b2" color="t2" style={{ textAlign: 'center' }}>
                  {LINK_BAD}
                </Text>
              ) : null}
              {phase.kind === 'linkRetry' ? (
                <Text v="b2" color="t2" style={{ textAlign: 'center' }}>
                  {ERROR_BODY}
                </Text>
              ) : null}
              {phase.kind === 'linkOk' ? (
                <View style={{ gap: spacing[2] }}>
                  <Text v="c1" weight="700" color="t3">
                    {LINK_FOUND_SECTION}
                  </Text>
                  <Pressable accessibilityRole="button" onPress={() => void choose(phase.posting)} style={{ minHeight: 60, justifyContent: 'center', gap: 2 }}>
                    <Text v="b1" weight="600">
                      {pickedLine(phase.posting)}
                    </Text>
                    <Text v="c1" color="t3">
                      {phase.meta}
                    </Text>
                    <Text v="c2" color="t3" numberOfLines={1}>
                      {phase.host}
                    </Text>
                  </Pressable>
                </View>
              ) : null}
              {phase.kind === 'error' ? (
                <View style={{ backgroundColor: c.redSoft, borderRadius: radius.md, paddingVertical: spacing[3], paddingHorizontal: 14, flexDirection: 'row', alignItems: 'flex-start', gap: spacing[2] }}>
                  <Icon name="alert" size={18} color="red" />
                  <View style={{ flex: 1, gap: spacing[1] }}>
                    <Text weight="700" color="red" style={{ fontSize: 14, lineHeight: 20 }}>
                      {ERROR_TITLE}
                    </Text>
                    <Text color="red" style={{ fontSize: 14, lineHeight: 20 }}>
                      {ERROR_BODY}
                    </Text>
                  </View>
                </View>
              ) : null}
              {searching ? (
                <View style={{ marginTop: 'auto', flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                  {linkWait ? (
                    <View style={{ flex: 1, minHeight: xl ? FIELD_XL : FIELD, borderRadius: xl ? 26 : 22, backgroundColor: c.fill, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                      <Icon name="link" size={18} color="t3" />
                      <Text v="b1" numberOfLines={1} style={{ flex: 1, fontSize: xl ? 19 : undefined }}>
                        {linkLabel(linkUrl ?? '')}
                      </Text>
                      <Spinner size={16} color="t3" />
                    </View>
                  ) : (
                    <View style={{ flex: 1, minHeight: xl ? FIELD_XL : FIELD, borderRadius: xl ? 26 : 22, backgroundColor: c.fill, paddingHorizontal: spacing[4], flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
                      <Icon name="search" size={18} color="t3" />
                      <TextInput
                        autoFocus
                        value={fieldValue(form)}
                        onChangeText={onType}
                        placeholder={SEARCH_PLACEHOLDER}
                        placeholderTextColor={c.t4}
                        accessibilityLabel={SEARCH_PLACEHOLDER}
                        autoCapitalize="none"
                        autoCorrect={false}
                        returnKeyType="search"
                        style={[{ flex: 1, color: c.t1, fontSize: xl ? 19 : type.b1.fontSize, paddingVertical: 0 }, fontFor('400')]}
                      />
                    </View>
                  )}
                  <GlassButton actions={[{ icon: 'x', label: SEARCH_CLOSE, onPress: () => setForm(closeSearch) }]} />
                </View>
              ) : null}
              {searching ? null : (
                <View style={{ marginTop: 'auto' }}>
                  <Cta
                    xl={xl}
                    enabled={phase.kind === 'picked' || phase.kind === 'creating' || phase.kind === 'error'}
                    busy={phase.kind === 'creating'}
                    icon={phase.kind === 'error' ? 'retry' : undefined}
                    label={phase.kind === 'creating' ? CREATING_LABEL : phase.kind === 'error' ? RETRY_LABEL : CREATE_LABEL}
                    onPress={phase.kind === 'error' ? () => void run(form) : onCreate}
                  />
                </View>
              )}
            </View>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
      {form.consent ? (
        <ConsentOverlay
          saving={consent.saving}
          onLater={() => setForm(dismissConsent)}
          onAgree={() => consent.save(true, { onSuccess: () => void run(dismissConsent(form)) })}
        />
      ) : null}
    </View>
  )
}

export default BotNewSheet
