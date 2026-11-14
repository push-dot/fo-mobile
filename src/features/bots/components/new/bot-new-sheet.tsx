import { useEffect, useRef, useState, type ReactNode } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { ApiError } from '@push/api-client'
import { useReferenceConsent } from '@/features/my'
import { Badge, Button, Glass, Highlight, GlassButton, GlassPressable, Icon, Mascot, Spinner, Text, useKeyboardHeight } from '@/shared/components'
import { fontFor, onAccent, platformTheme, radius, spacing, useColors, type } from '@/theme'
import { MASCOT_PALETTES } from '@/theme/mascot'
import { botErrorKind } from '../../api/errors'
import { checkLink, findBotForPosting } from '../../api/fetchers'
import { useBots, useCreateBot, useDeleteBot } from '../../api/hooks'
import { BOT_COLORS } from '../../constants'
import type { BotColor, BotId, BotLimit, CompanyBot } from '../../types'
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
  markFinding,
  onPostingChosen,
  pickPosting,
  postingMeta,
  postingOf,
  retryCreate,
  setQuery,
  startLinkCheck,
  submitCreate,
  type CreateForm,
  type PostingPick,
} from '../../utils/create-form'
import { confirmDeleteBot } from '../profile/confirm-delete-bot'
import { SheetCard } from '../profile/sheet-card'
import BotLimitDelete from './bot-limit-delete'
import {
  CANCEL_LABEL,
  CLOSE_LABEL,
  CONSENT_AGREE,
  CONSENT_BODY,
  CONSENT_LATER,
  CONSENT_MORE,
  CONSENT_TITLE,
  CREATE_LABEL,
  CREATING_LABEL,
  CURRENT_PLAN,
  DELETE_TITLE,
  ERROR_BODY,
  ERROR_TITLE,
  LINK_BAD,
  LINK_CHECKING_LABEL,
  LINK_FINDING_AFTER_MS,
  NAME_PLACEHOLDER,
  ORGANIZE_LABEL,
  RETRY_LABEL,
  SEARCH_CLOSE,
  SEARCH_DEBOUNCE_MS,
  SEARCH_EMPTY,
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
const PREVIEW_SUB = 14
const PREVIEW_SUB_LINE = 20
const BAR = 6
const FIELD = 44
const FIELD_XL = 52
const CTA = 56
const CREATING_DIM = 0.7
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

const Cta = ({ label, onPress, busy, enabled, xl }: { label: string; onPress: () => void; busy?: boolean; enabled: boolean; xl: boolean }) => {
  const c = useColors()
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled || !!busy, busy: !!busy }}
      glass={false}
      fill={enabled ? 'ac' : 'fill2'}
      pressedFill="acPress"
      onPress={!enabled || busy ? undefined : onPress}
      contentStyle={busy ? { gap: spacing[2] } : undefined}
      style={{ minHeight: xl ? CTA_XL : CTA, borderRadius: platformTheme.buttonRadius, opacity: busy ? CREATING_DIM : 1 }}
    >
      {busy ? <Spinner size={18} color="onFill" /> : null}
      <Text weight="700" numberOfLines={1} allowFontScaling={!xl} style={{ flexShrink: 1, color: enabled ? onAccent : c.t3, fontSize: xl ? CTA_FONT_XL : type.button.fontSize, lineHeight: xl ? 30 : type.button.lineHeight }}>
        {label}
      </Text>
    </GlassPressable>
  )
}

const RING = DOT + 10

const Swatch = ({ name, on, onPick }: { name: BotColor; on: boolean; onPick: (next: BotColor) => void }) => {
  const c = useColors()
  const ring = { width: RING, height: RING, borderRadius: RING / 2, borderWidth: on ? 2 : 0, borderColor: c.t1, alignItems: 'center' as const, justifyContent: 'center' as const }
  return (
    <Pressable accessibilityRole="button" accessibilityLabel={name} accessibilityState={{ selected: on }} onPress={() => onPick(name)} style={{ width: SWATCH, height: SWATCH, alignItems: 'center', justifyContent: 'center' }}>
      <View style={ring}>
        <View style={{ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: MASCOT_PALETTES[name].body }} />
      </View>
    </Pressable>
  )
}

const SWATCH_ROW = 6

// BotNew board: 6 + 5, centered, whatever the screen's width.
const Swatches = ({ color, onPick }: { color: BotColor; onPick: (next: BotColor) => void }) => (
  <View style={{ alignItems: 'center', rowGap: spacing[1] }}>
    {[BOT_COLORS.slice(0, SWATCH_ROW), BOT_COLORS.slice(SWATCH_ROW)].map((names, i) => (
      <View key={i} style={{ flexDirection: 'row', columnGap: spacing[2] }}>
        {names.map((name) => (
          <Swatch key={name} name={name} on={name === color} onPick={onPick} />
        ))}
      </View>
    ))}
  </View>
)

const LIMIT_MASCOTS = ['teal', 'amber', 'pink'] as const
const PLAN_ROW = 56
const LIMIT_MASCOT = 64
const LIMIT_OVERLAP = -14

const LimitBody = ({ limit }: { limit: BotLimit | undefined }) => {
  const c = useColors()
  const copy = limit ? limitCopy(limit) : null
  if (!copy) return null
  return (
    <View>
      <View style={{ alignItems: 'center', gap: 10, paddingTop: 28, paddingHorizontal: 36 }}>
        <View style={{ flexDirection: 'row', marginBottom: 6 }}>
          {LIMIT_MASCOTS.map((color, i) => (
            <View key={color} style={{ marginLeft: i > 0 ? LIMIT_OVERLAP : 0 }}>
              <Mascot size={LIMIT_MASCOT} color={color} motion={{ mode: 'still' }} />
            </View>
          ))}
        </View>
        <Text v="h2" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {copy.title}
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {copy.body}
        </Text>
      </View>
      <View style={{ marginTop: spacing[5], backgroundColor: c.bg2, borderRadius: radius.lg, paddingHorizontal: spacing[4] }}>
        {copy.rows.map((row, i) => (
          <View key={row.plan} style={{ minHeight: PLAN_ROW, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: i > 0 ? 1 : 0, borderTopColor: c.line }}>
            <Text v="b1" weight="700">
              {row.plan}
            </Text>
            {row.current ? <Badge label={CURRENT_PLAN} tone="grey" /> : null}
            <Text v="b1" weight="700" color="t2" style={{ marginLeft: 'auto' }}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

// BotNewConsent is the platform's own sheet: the floating iOS sheet, the Android bottom sheet. Back and the scrim close it.
const ConsentSheet = ({ saving, onAgree, onLater }: { saving: boolean; onAgree: () => void; onLater: () => void }) => (
  <SheetCard label={CONSENT_TITLE.replace('\n', ' ')} onClose={onLater}>
    <Text v="h2" accessibilityRole="header" style={{ paddingTop: spacing[1] }}>
      {CONSENT_TITLE}
    </Text>
    <Text v="b2" color="t2">
      {CONSENT_BODY}
    </Text>
    <View style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center', marginVertical: -spacing[2] }}>
      <Text v="c1" weight="600" color="acText" style={{ textDecorationLine: 'underline' }}>
        {CONSENT_MORE}
      </Text>
    </View>
    <View style={{ gap: spacing[2], marginTop: spacing[2] }}>
      <Button label={CONSENT_AGREE} disabled={saving} onPress={onAgree} />
      <Button label={CONSENT_LATER} variant="secondary" onPress={onLater} />
    </View>
  </SheetCard>
)

const BotNewSheet = ({ postingId, onClose, onOpenBot, onUpgrade }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const window = useWindowDimensions()
  const xl = window.fontScale >= XL_FONT_SCALE
  const [sheetBottom, setSheetBottom] = useState(window.height)
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState<PostingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const limitFrom = useRef<PostingPick | null>(null)
  const bots = useBots()
  const removeBot = useDeleteBot()
  const consent = useReferenceConsent()
  const { create } = useCreateBot()
  const openRef = useRef(onOpenBot)
  useEffect(() => {
    openRef.current = onOpenBot
  }, [onOpenBot])
  const phase = form.phase
  const searching = searchPhase(form)
  const posting = postingOf(phase)
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
      else if (botErrorKind(error) === 'limit') {
        limitFrom.current = postingOf(base.phase)
        setForm(failCreate(base, 'limit'))
      }
      else setForm(failCreate(base, 'error'))
    }
  }

  const onCreate = () => {
    void run(form)
  }

  // BotNewError: the platform's alert, not a box drawn in the screen. 다시 시도 creates again; the 만들기 button below does the same.
  const failed = phase.kind === 'error'
  useEffect(() => {
    if (!failed) return
    Alert.alert(ERROR_TITLE, ERROR_BODY, [
      { text: CANCEL_LABEL, style: 'cancel' },
      { text: RETRY_LABEL, onPress: () => void run(form) },
    ])
    // eslint-disable-next-line react-hooks/exhaustive-deps -- shown once per failure, not per render
  }, [failed])

  const companyBots = (bots.data ?? []).filter((bot): bot is CompanyBot => bot.kind === 'company')
  const onDeleteBot = (bot: CompanyBot) =>
    confirmDeleteBot(bot.name, () => {
      void removeBot(bot)
        .then(() => {
          setOrganizing(false)
          const from = limitFrom.current
          setForm((current) => (from ? pickPosting(current, from) : closeSearch(current)))
        })
        .catch(() => undefined)
    })

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
  const control = xl ? FIELD_XL : FIELD
  const fieldFont = xl ? 19 : type.b1.fontSize
  const ios = Platform.OS === 'ios'
  const fieldBox = { height: control, borderRadius: control / 2 }
  const fieldRow = { flex: 1, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[2], paddingHorizontal: spacing[4] }
  const shell = (children: ReactNode, style?: object) =>
    ios ? (
      <Glass style={[fieldBox, style]}>
        <View style={fieldRow}>{children}</View>
      </Glass>
    ) : (
      <View style={[fieldBox, { backgroundColor: c.fill }, style]}>
        <View style={fieldRow}>{children}</View>
      </View>
    )
  const searchIcon = <Icon name="search" size={20} color="t3" />
  const closeButton = <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: SEARCH_CLOSE, onPress: () => setForm(closeSearch) }]} />
  const rowTitle = { minHeight: 60, justifyContent: 'center' as const, gap: 2, paddingVertical: spacing[2] + 2, paddingHorizontal: spacing[5] }
  const card = { marginTop: spacing[2], marginHorizontal: spacing[4], borderRadius: radius.lg, backgroundColor: c.bg2 }
  const note = { textAlign: 'center' as const, paddingHorizontal: 32, paddingBottom: 28, fontSize: type.b2.fontSize, lineHeight: type.b2.lineHeight }
  const showRows = phase.kind === 'searching' && !!query && !asLink(query) && rows.length > 0
  const keepTop = showRows || linkWait || phase.kind === 'linkOk'

  // The iOS modal starts under the status bar, so its header sits 14pt from the sheet's own top: the board's 36pt to the title centre. Android's full sheet reaches under the status bar.
  const header = (
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], paddingTop: (ios ? 0 : insets.top) + 14, paddingHorizontal: spacing[4], paddingBottom: spacing[1] }}>
      {searching ? (
        <View style={{ width: control, height: control }} />
      ) : organizing ? (
        <GlassButton circle iconSize={20} actions={[{ icon: 'back', label: '뒤로', onPress: () => setOrganizing(false) }]} />
      ) : (
        <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: CLOSE_LABEL, onPress: onClose }]} />
      )}
      <Text v="h3" accessibilityRole="header" allowFontScaling={!xl} style={[{ flex: 1, textAlign: 'center' }, xl ? { fontSize: 22, lineHeight: 30 } : null]}>
        {organizing ? DELETE_TITLE : SHEET_TITLE}
      </Text>
      <View style={{ width: control, height: control }} />
    </View>
  )

  const preview = (
    <View style={{ marginTop: 'auto', alignItems: 'center', gap: spacing[2], paddingTop: 2, paddingHorizontal: spacing[6] }}>
      <Mascot size={PREVIEW} color={form.color} state={phase.kind === 'creating' ? 'work' : 'idle'} motion={{ mode: 'still' }} />
      <Text weight={name ? '800' : '700'} color={name ? 't1' : 't3'} numberOfLines={2} style={{ fontSize: 24, lineHeight: 32, textAlign: 'center', maxWidth: 320 }}>
        {name ?? NAME_PLACEHOLDER}
      </Text>
      {posting ? (
        <Text color="t3" style={{ fontSize: xl ? type.h3.fontSize : PREVIEW_SUB, lineHeight: xl ? type.h3.lineHeight : PREVIEW_SUB_LINE, textAlign: 'center' }}>
          {posting.title}
        </Text>
      ) : null}
    </View>
  )

  // Only a phase that carries a posting has a line to show; searching, link and limit phases have none.
  const mainField =
    !posting
      ? shell(
          <Pressable accessibilityRole="button" accessibilityLabel={SEARCH_PLACEHOLDER} onPress={() => setForm(focusSearch)} style={{ flex: 1, flexDirection: 'row', alignItems: 'center', gap: spacing[2] }}>
            {searchIcon}
            <Text color="t3" style={{ flex: 1, fontSize: fieldFont, lineHeight: type.b1.lineHeight }}>
              {SEARCH_PLACEHOLDER}
            </Text>
          </Pressable>,
          { marginHorizontal: spacing[4] },
        )
      : shell(
          <>
            {searchIcon}
            <Pressable accessibilityRole="button" accessibilityLabel={pickedLine(posting)} onPress={phase.kind === 'creating' ? undefined : () => setForm(focusSearch)} style={{ flex: 1 }}>
              <Text color={phase.kind === 'creating' ? 't3' : 't1'} numberOfLines={1} style={{ fontSize: fieldFont, lineHeight: type.b1.lineHeight }}>
                {pickedLine(posting)}
              </Text>
            </Pressable>
            {phase.kind === 'creating' ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel="지우기" onPress={() => setForm(clearPosting)} style={{ width: 44, height: 44, marginRight: -14, alignItems: 'center', justifyContent: 'center' }}>
                <View style={{ width: 20, height: 20, borderRadius: 10, backgroundColor: c.fill2, alignItems: 'center', justifyContent: 'center' }}>
                  <Icon name="x" size={12} color="t2" />
                </View>
              </Pressable>
            )}
          </>,
          { marginHorizontal: spacing[4] },
        )

  const searchBody = (
    <>
      <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, justifyContent: keepTop ? 'flex-start' : 'flex-end' }}>
        {phase.kind === 'searching' && query && !asLink(query) && !loading && rows.length === 0 ? <Text color="t3" style={note}>{SEARCH_EMPTY}</Text> : null}
        {showRows
          ? rows.map((row) => (
              <Pressable key={row.postingId} accessibilityRole="button" onPress={() => void choose(row)} style={[rowTitle, card]}>
                <Text v="b1" weight="600" style={{ lineHeight: type.b2.lineHeight }}>
                  <Highlight text={pickedLine(row)} q={query.trim()} weight="600" />
                </Text>
                <Text color="t3" style={{ fontSize: type.c1.fontSize, lineHeight: type.c1.lineHeight }}>
                  {row.meta}
                </Text>
              </Pressable>
            ))
          : null}
        {linkWait ? (
          <View style={{ gap: spacing[2], paddingTop: 14, paddingHorizontal: spacing[5], paddingBottom: BAR }}>
            <View style={{ width: '70%', height: 12, borderRadius: BAR, backgroundColor: c.fill }} />
            <View style={{ width: '45%', height: 12, borderRadius: BAR, backgroundColor: c.fill }} />
          </View>
        ) : null}
        {phase.kind === 'linkBad' ? <Text lineBreakStrategyIOS="hangul-word" style={note}>{LINK_BAD}</Text> : null}
        {phase.kind === 'linkRetry' ? <Text color="t3" lineBreakStrategyIOS="hangul-word" style={note}>{ERROR_BODY}</Text> : null}
        {phase.kind === 'linkOk' ? (
          <Pressable accessibilityRole="button" onPress={() => void choose(phase.posting)} style={[rowTitle, card]}>
            <Text weight="700" numberOfLines={2} style={{ fontSize: type.b1.fontSize, lineHeight: type.b2.lineHeight }}>
              {pickedLine(phase.posting)}
            </Text>
            <Text color="t3" style={{ fontSize: type.c1.fontSize, lineHeight: type.c1.lineHeight }}>
              {phase.meta}
            </Text>
            <Text color="t3" numberOfLines={1} style={{ fontSize: type.c2.fontSize, lineHeight: type.c2.lineHeight }}>
              {phase.host}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={{ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: spacing[2], paddingHorizontal: spacing[4], paddingBottom: 10 + (keyboard > 0 ? 0 : insets.bottom) }}>
        {shell(
          <>
            {searchIcon}
            {/* Stays mounted while the link is checked: unmounting it drops the focus and the keyboard (BotNewLinkChecking draws both). */}
            <TextInput
              autoFocus
              value={fieldValue(form)}
              onChangeText={linkWait ? undefined : onType}
              caretHidden={linkWait}
              placeholder={linkWait ? undefined : SEARCH_PLACEHOLDER}
              placeholderTextColor={c.t3}
              accessibilityLabel={linkWait ? LINK_CHECKING_LABEL : SEARCH_PLACEHOLDER}
              autoCapitalize="none"
              autoCorrect={false}
              returnKeyType="search"
              style={[{ flex: 1, color: c.t1, fontSize: fieldFont, paddingVertical: 0 }, fontFor('400')]}
            />
            {linkWait ? <Spinner size={18} color="t3" /> : null}
          </>,
          { flex: 1 },
        )}
        {closeButton}
      </View>
    </>
  )

  const footer = (
    <View style={{ gap: spacing[2], paddingTop: spacing[1], paddingHorizontal: spacing[4], paddingBottom: insets.bottom + spacing[2] }}>
      <Cta
        xl={xl}
        enabled={phase.kind === 'picked' || phase.kind === 'creating' || phase.kind === 'error'}
        busy={phase.kind === 'creating'}
        label={phase.kind === 'creating' ? CREATING_LABEL : CREATE_LABEL}
        onPress={onCreate}
      />
    </View>
  )

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      {/* The modal ends at the screen's bottom, so the keyboard offset is the sheet's top edge; without it the search field stays under the keyboard. */}
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior="padding"
        keyboardVerticalOffset={ios ? window.height - sheetBottom : 0}
        onLayout={(e) => setSheetBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        {header}
        {phase.kind === 'limit' && organizing ? (
          <BotLimitDelete bots={companyBots} onDelete={onDeleteBot} />
        ) : phase.kind === 'limit' ? (
          <>
            <ScrollView style={{ flex: 1 }} contentContainerStyle={{ paddingHorizontal: spacing[4], paddingBottom: spacing[6] }}>
              <LimitBody limit={bots.limit} />
            </ScrollView>
            <View style={{ gap: spacing[2], paddingTop: spacing[3], paddingHorizontal: spacing[4], paddingBottom: insets.bottom + spacing[2] }}>
              <Button label={UPGRADE_LABEL} onPress={onUpgrade} />
              <Button label={ORGANIZE_LABEL} variant="secondary" onPress={() => setOrganizing(true)} />
            </View>
          </>
        ) : searching ? (
          searchBody
        ) : (
          <>
            <ScrollView keyboardShouldPersistTaps="handled" style={{ flex: 1 }} contentContainerStyle={{ flexGrow: 1, gap: 28, paddingTop: spacing[1], paddingBottom: spacing[3] }}>
              {preview}
              <View style={{ marginBottom: 'auto' }}>
                <Swatches color={form.color} onPick={(next) => setForm((current) => chooseColor(current, next))} />
              </View>
              {mainField}
            </ScrollView>
            {footer}
          </>
        )}
      </KeyboardAvoidingView>
      {form.consent ? (
        <ConsentSheet
          saving={consent.saving}
          onLater={() => setForm(dismissConsent)}
          onAgree={() => consent.save(true, { onSuccess: () => void run(dismissConsent(form)) })}
        />
      ) : null}
    </View>
  )
}

export default BotNewSheet
