import { useQueryClient } from '@tanstack/react-query'
import { useEffect, useEffectEvent, useRef, useState, type ReactNode } from 'react'
import { Alert, KeyboardAvoidingView, Platform, Pressable, ScrollView, TextInput, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { StyleSheet } from 'react-native-unistyles'
import { Badge, Button, Highlight, GlassButton, GlassPressable, Icon, Mascot, Spinner, Text, useKeyboardHeight, WordClampText } from '@/shared/components'
import { fontFor, onAccent, useColors, type } from '@/theme'
import { sheetGlassFill } from '@/shared/components/glass'
import { MASCOT_PALETTES } from '@/theme/mascot'
import { isXlBoardText, XlBoardChrome } from '@/shared/components/xl-chrome'
import { isConsentRequired } from '@/shared/utility/consent-error'
import { botErrorKind } from '../../utils/bot-errors'
import { checkLink } from '../../api/fetchers'
import { botListQuery, useBots, useCreateBot, useDeleteBot } from '../../api/hooks'
import { BOT_COLORS } from '../../constants'
import type { BotColor, BotId, BotLimit, CompanyBot } from '../../types'
import {
  asLink,
  beginCreate,
  chooseColor,
  clearPosting,
  closeSearch,
  failCreate,
  focusSearch,
  initialForm,
  limitCopy,
  linkFailed,
  linkFound,
  linkLabel,
  linkMissing,
  markFinding,
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
import { colorA11y } from '../profile/profile-rows'
import BotLimitDelete from './bot-limit-delete'
import {
  CANCEL_LABEL,
  CLOSE_LABEL,
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
} from './copy'
import { loadPosting, searchPostings, type PostingRow } from './posting-search'

type Props = {
  postingId?: string
  onClose: () => void
  onOpenBot: (id: BotId) => void
  onUpgrade: () => void
  onConsentRequired: (retry: () => void) => void
}

const SWATCH = 46
const DOT = 34
const ROW_TITLE = 17
const PREVIEW = 120
const PREVIEW_SUB = 14
const PREVIEW_SUB_LINE = 20
const BAR = 6
const FIELD = 44
const FIELD_XL = 52
const CTA = 56
const FIELD_SHADOW = {
  light: '0 2px 8px rgba(0,0,0,.06), 0 0 0 .5px rgba(0,0,0,.08), inset 0 1px 0 rgba(255,255,255,.95)',
  dark: '0 2px 8px rgba(0,0,0,.35), 0 0 0 .5px rgba(255,255,255,.12), inset 0 1px 0 rgba(255,255,255,.16)',
}
const CREATING_DIM = 0.75
const FIELD_DIS = 0.55
const CTA_XL = 64
const CTA_FONT_XL = 21


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
  return (
    <GlassPressable
      accessibilityRole="button"
      accessibilityState={{ disabled: !enabled || !!busy, busy: !!busy }}
      glass={false}
      fill={enabled ? 'ac' : 'fill2'}
      pressedFill="acPress"
      onPress={!enabled || busy ? undefined : onPress}
      contentStyle={busy ? styles.ctaBusyContent : undefined}
      style={[styles.cta, xl && styles.ctaXl, busy && styles.ctaBusy]}
    >
      {busy ? <Spinner size={18} color="onFill" /> : null}
      <Text weight="700" numberOfLines={1} allowFontScaling={!xl} style={[styles.ctaLabel, !enabled && styles.ctaLabelOff, xl && styles.ctaLabelXl]}>
        {label}
      </Text>
    </GlassPressable>
  )
}

const RING = DOT + 10

const Swatch = ({ name, index, on, onPick }: { name: BotColor; index: number; on: boolean; onPick: (next: BotColor) => void }) => {
  return (
    <Pressable accessibilityRole="radio" accessibilityLabel={colorA11y(index)} accessibilityState={{ selected: on }} onPress={() => onPick(name)} style={styles.swatch}>
      <View style={[styles.ring, on && styles.ringOn]}>
        <View style={styles.dot(name)} />
      </View>
    </Pressable>
  )
}

const Swatches = ({ color, onPick }: { color: BotColor; onPick: (next: BotColor) => void }) => (
  <View accessibilityRole="radiogroup" style={styles.swatches}>
    {BOT_COLORS.map((name, index) => (
      <Swatch key={name} name={name} index={index} on={name === color} onPick={onPick} />
    ))}
  </View>
)

const LIMIT_MASCOTS = ['teal', 'amber', 'pink'] as const
const PLAN_ROW = 56
const LIMIT_MASCOT = 64
const LIMIT_OVERLAP = -14

const LimitBody = ({ limit }: { limit: BotLimit | undefined }) => {
  const copy = limit ? limitCopy(limit) : null
  if (!copy) return null
  return (
    <View>
      <View style={styles.limitHead}>
        <View style={styles.limitMascots}>
          {LIMIT_MASCOTS.map((color, i) => (
            <View key={color} style={i > 0 && styles.overlap}>
              <Mascot size={LIMIT_MASCOT} color={color} motion={{ mode: 'still' }} />
            </View>
          ))}
        </View>
        <Text v="h2" accessibilityRole="header" style={styles.center}>
          {copy.title}
        </Text>
        <Text v="b2" color="t3" style={styles.center}>
          {copy.body}
        </Text>
      </View>
      <View style={styles.plans}>
        {copy.rows.map((row, i) => (
          <View key={row.plan} style={[styles.planRow, i > 0 && styles.planRowDivided]}>
            <Text v="b1" weight="700">
              {row.plan}
            </Text>
            {row.current ? <Badge label={CURRENT_PLAN} /> : null}
            <Text v="b1" weight="700" color="t2" style={styles.planValue}>
              {row.value}
            </Text>
          </View>
        ))}
      </View>
    </View>
  )
}

const BotNewSheet = ({ postingId, onClose, onOpenBot, onUpgrade, onConsentRequired }: Props) => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const keyboard = useKeyboardHeight()
  const window = useWindowDimensions()
  const xl = isXlBoardText(window.fontScale)
  const [sheetBottom, setSheetBottom] = useState(window.height)
  const [form, setForm] = useState(initialForm)
  const [rows, setRows] = useState<PostingRow[]>([])
  const [loading, setLoading] = useState(false)
  const [organizing, setOrganizing] = useState(false)
  const limitFrom = useRef<PostingPick | null>(null)
  const bots = useBots()
  const removeBot = useDeleteBot()
  const { create } = useCreateBot()
  const companyBots = (bots.data ?? []).filter((bot): bot is CompanyBot => bot.kind === 'company')
  const existingFor = (id: string) => companyBots.find((bot) => bot.postingId === id)
  const queryClient = useQueryClient()
  const openBot = useEffectEvent(onOpenBot)
  const phase = form.phase
  const searching = searchPhase(form)
  const posting = postingOf(phase)
  const query = phase.kind === 'searching' ? phase.query : ''

  useEffect(() => {
    if (!postingId) return
    let cancel = false
    void (async () => {
      const list = await queryClient.ensureQueryData(botListQuery).catch(() => undefined)
      if (cancel) return
      const existing = list?.bots.find((bot) => bot.kind === 'company' && bot.postingId === postingId)
      if (existing) return openBot(existing.id)
      const posting = await loadPosting(postingId)
      if (cancel || !posting) return
      setForm((current) => (current.phase.kind === 'idle' ? pickPosting(current, posting) : current))
    })()
    return () => {
      cancel = true
    }
  }, [postingId, queryClient])

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
    const action = base.phase.kind === 'error' ? retryCreate(base) : submitCreate(base)
    if (action.action !== 'create') return
    setForm(beginCreate(base))
    try {
      const result = await create({ postingId: action.posting.postingId, color: action.color })
      onOpenBot(result.bot.id)
    } catch (error) {
      if (isConsentRequired(error)) {
        setForm(base)
        onConsentRequired(() => void run(base))
        return
      }
      if (botErrorKind(error) === 'limit') {
        limitFrom.current = postingOf(base.phase)
        setForm(failCreate(base, 'limit'))
      }
      else {
        const next = failCreate(base, 'error')
        setForm(next)
        Alert.alert(ERROR_TITLE, ERROR_BODY, [
          { text: CANCEL_LABEL, style: 'cancel' },
          { text: RETRY_LABEL, onPress: () => void run(next) },
        ])
      }
    }
  }

  const onCreate = () => {
    void run(form)
  }

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

  const choose = (row: PostingPick) => {
    const existing = existingFor(row.postingId)
    if (existing) onOpenBot(existing.id)
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
  const fieldLine = xl ? 29 : type.b1.lineHeight
  const ios = Platform.OS === 'ios'
  const shell = (children: ReactNode, style?: object) => (
    <View style={[styles.field(control), style]}>
      <View style={styles.fieldRow}>{children}</View>
    </View>
  )
  const searchIcon = <Icon name="search" size={20} color="t3" />
  const closeButton = <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: SEARCH_CLOSE, onPress: () => setForm(closeSearch) }]} />
  const showRows = phase.kind === 'searching' && !!query && !asLink(query) && rows.length > 0
  const keepTop = showRows || linkWait || phase.kind === 'linkOk'
  const noResults = phase.kind === 'searching' && !!query && !asLink(query) && !loading && rows.length === 0

  const header = (
    <View style={styles.header(ios ? 0 : insets.top)}>
      {organizing ? (
        <GlassButton circle iconSize={20} actions={[{ icon: 'back', label: '뒤로', onPress: () => setOrganizing(false) }]} />
      ) : (
        <GlassButton circle iconSize={20} actions={[{ icon: 'x', label: CLOSE_LABEL, onPress: phase.kind === 'creating' ? undefined : onClose }]} />
      )}
      <Text v="h3" accessibilityRole="header" allowFontScaling={!xl} style={[styles.title, xl && styles.titleXl]}>
        {organizing ? DELETE_TITLE : SHEET_TITLE}
      </Text>
      <View style={styles.spacer(control)} />
    </View>
  )

  const preview = (
    <View style={styles.preview}>
      <Mascot size={PREVIEW} color={form.color} state={phase.kind === 'creating' ? 'work' : 'idle'} motion={{ mode: phase.kind === 'creating' ? 'animate' : 'still' }} />
      <WordClampText
        lines={2}
        ellipsis="hang"
        weight={name ? '800' : '700'}
        color={name ? 't1' : 't3'}
        allowFontScaling={!xl}
        wrapperStyle={styles.previewNameWrap}
        style={styles.previewName}
      >
        {name ?? NAME_PLACEHOLDER}
      </WordClampText>
      {posting ? (
        <Text color="t3" allowFontScaling={!xl} style={styles.previewSub}>
          {posting.title}
        </Text>
      ) : null}
    </View>
  )

  const fieldShell =
    !posting
      ? shell(
          <Pressable accessibilityRole="button" accessibilityLabel={SEARCH_PLACEHOLDER} onPress={() => setForm(focusSearch)} style={styles.fieldPress}>
            {searchIcon}
            <Text color="t3" allowFontScaling={!xl} style={[styles.flex, styles.fieldType(fieldFont, fieldLine)]}>
              {SEARCH_PLACEHOLDER}
            </Text>
          </Pressable>,
          styles.fieldInset,
        )
      : shell(
          <>
            {searchIcon}
            <Pressable accessibilityRole="button" accessibilityLabel={pickedLine(posting)} onPress={phase.kind === 'creating' ? undefined : () => setForm(focusSearch)} style={styles.flex}>
              <WordClampText lines={1} ellipsis="inline" allowFontScaling={!xl} style={styles.fieldType(fieldFont, fieldLine)}>
                {pickedLine(posting)}
              </WordClampText>
            </Pressable>
            {phase.kind === 'creating' ? null : (
              <Pressable accessibilityRole="button" accessibilityLabel="지우기" onPress={() => setForm(clearPosting)} style={styles.clearHit}>
                <View style={styles.clearDot}>
                  <Icon name="x" size={12} color="t2" />
                </View>
              </Pressable>
            )}
          </>,
          styles.fieldInset,
        )
  const mainField = phase.kind === 'creating' ? <View style={styles.dim}>{fieldShell}</View> : fieldShell

  const searchBody = (
    <>
      <ScrollView keyboardShouldPersistTaps="handled" style={styles.flex} contentContainerStyle={styles.searchContent(noResults ? 'center' : keepTop ? 'flex-start' : 'flex-end')}>
        {noResults ? <Text color="t3" style={[styles.note, styles.noteFlush]}>{SEARCH_EMPTY}</Text> : null}
        {showRows
          ? rows.map((row) => (
              <Pressable key={row.postingId} accessibilityRole="button" onPress={() => choose(row)} style={[styles.rowTitle, styles.card]}>
                <Text v="b1" weight="600" style={styles.rowTitleText}>
                  <Highlight text={pickedLine(row)} q={query.trim()} weight="600" />
                </Text>
                <Text color="t3" style={styles.meta}>
                  {row.meta}
                </Text>
              </Pressable>
            ))
          : null}
        {linkWait ? (
          <View style={styles.linkWait}>
            <View style={styles.bar('70%')} />
            <View style={styles.bar('45%')} />
          </View>
        ) : null}
        {phase.kind === 'linkBad' ? <Text lineBreakStrategyIOS="hangul-word" style={styles.note}>{LINK_BAD}</Text> : null}
        {phase.kind === 'linkRetry' ? <Text color="t3" lineBreakStrategyIOS="hangul-word" style={styles.note}>{ERROR_BODY}</Text> : null}
        {phase.kind === 'linkOk' ? (
          <Pressable accessibilityRole="button" onPress={() => choose(phase.posting)} style={[styles.rowTitle, styles.card]}>
            <Text weight="600" numberOfLines={2} style={styles.rowTitleText}>
              {pickedLine(phase.posting)}
            </Text>
            <Text color="t3" style={styles.meta}>
              {phase.meta}
            </Text>
            <Text color="t3" numberOfLines={1} style={styles.host}>
              {phase.host}
            </Text>
          </Pressable>
        ) : null}
      </ScrollView>
      <View style={styles.searchBar(keyboard > 0 ? 0 : insets.bottom)}>
        {shell(
          <>
            {searchIcon}
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
              allowFontScaling={!xl}
              style={[styles.input(fieldFont), fontFor('400')]}
            />
            {linkWait ? <Spinner size={18} color="ac" /> : null}
          </>,
          styles.flex,
        )}
        {closeButton}
      </View>
    </>
  )

  const footer = (
    <View style={styles.footer(insets.bottom)}>
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
    <View style={styles.screen}>
      <KeyboardAvoidingView
        style={styles.flex}
        behavior="padding"
        keyboardVerticalOffset={ios ? window.height - sheetBottom : 0}
        onLayout={(e) => setSheetBottom(e.nativeEvent.layout.y + e.nativeEvent.layout.height)}
      >
        {header}
        {phase.kind === 'limit' && organizing ? (
          <BotLimitDelete bots={companyBots} onDelete={onDeleteBot} />
        ) : phase.kind === 'limit' ? (
          <>
            <ScrollView style={styles.flex} contentContainerStyle={styles.limitContent}>
              <LimitBody limit={bots.limit} />
            </ScrollView>
            <View style={styles.limitActions(insets.bottom)}>
              <Button label={UPGRADE_LABEL} onPress={onUpgrade} />
              <Button label={ORGANIZE_LABEL} variant="secondary" onPress={() => setOrganizing(true)} />
            </View>
          </>
        ) : searching ? (
          searchBody
        ) : (
          <>
            <ScrollView keyboardShouldPersistTaps="handled" style={styles.flex} contentContainerStyle={styles.mainContent}>
              {preview}
              <View style={styles.swatchWrap}>
                <Swatches color={form.color} onPick={(next) => setForm((current) => chooseColor(current, next))} />
              </View>
            </ScrollView>
            <View>
              <View style={styles.fieldWrap}>{mainField}</View>
              {footer}
            </View>
          </>
        )}
      </KeyboardAvoidingView>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  flex: { flex: 1 },
  center: { textAlign: 'center' },
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  cta: { minHeight: CTA, borderRadius: theme.platform.buttonRadius, opacity: 1 },
  ctaXl: { minHeight: CTA_XL },
  ctaBusy: { opacity: CREATING_DIM },
  ctaBusyContent: { gap: theme.spacing[2] },
  ctaLabel: { flexShrink: 1, color: onAccent, fontSize: type.button.fontSize, lineHeight: type.button.lineHeight },
  ctaLabelOff: { color: theme.colors.t3 },
  ctaLabelXl: { fontSize: CTA_FONT_XL, lineHeight: 30 },
  swatch: { width: SWATCH, height: SWATCH, alignItems: 'center', justifyContent: 'center' },
  ring: { width: RING, height: RING, borderRadius: RING / 2, borderWidth: 0, borderColor: theme.colors.t1, alignItems: 'center', justifyContent: 'center' },
  ringOn: { borderWidth: 2 },
  dot: (name: BotColor) => ({ width: DOT, height: DOT, borderRadius: DOT / 2, backgroundColor: MASCOT_PALETTES[name].body }),
  swatches: { flexDirection: 'row', flexWrap: 'wrap', justifyContent: 'center', columnGap: theme.spacing[2], rowGap: theme.spacing[1], paddingHorizontal: theme.spacing[4] },
  limitHead: { alignItems: 'center', gap: 10, paddingTop: 28, paddingHorizontal: 36 },
  limitMascots: { flexDirection: 'row', marginBottom: 6 },
  overlap: { marginLeft: LIMIT_OVERLAP },
  plans: { marginTop: theme.spacing[5], backgroundColor: theme.colors.bg2, borderRadius: theme.radius.lg, paddingHorizontal: theme.spacing[4] },
  planRow: { minHeight: PLAN_ROW, flexDirection: 'row', alignItems: 'center', gap: 10, borderTopWidth: 0, borderTopColor: theme.colors.line },
  planRowDivided: { borderTopWidth: 1 },
  planValue: { marginLeft: 'auto' },
  field: (control: number) => ({
    height: control,
    borderRadius: control / 2,
    boxShadow: Platform.OS === 'ios' ? FIELD_SHADOW[theme.mode] : undefined,
    backgroundColor: Platform.OS === 'ios' ? (sheetGlassFill(true, theme.mode === 'dark', theme.colors) ?? undefined) : theme.colors.fill,
  }),
  fieldRow: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingHorizontal: theme.spacing[4] },
  fieldInset: { marginHorizontal: theme.spacing[4] },
  fieldPress: { flex: 1, flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2] },
  fieldType: (fontSize: number, lineHeight: number) => ({ fontSize, lineHeight }),
  clearHit: { width: 44, height: 44, marginRight: -14, alignItems: 'center', justifyContent: 'center' },
  clearDot: { width: 20, height: 20, borderRadius: 10, backgroundColor: theme.colors.fill2, alignItems: 'center', justifyContent: 'center' },
  dim: { opacity: FIELD_DIS },
  rowTitle: { justifyContent: 'center', gap: 2, paddingVertical: 14, paddingHorizontal: theme.spacing[4] },
  rowTitleText: { fontSize: ROW_TITLE, lineHeight: type.b2.lineHeight },
  card: { marginTop: theme.spacing[2], marginHorizontal: theme.spacing[4], borderRadius: theme.radius.lg, backgroundColor: theme.colors.bg2 },
  note: { textAlign: 'center', paddingHorizontal: 32, paddingBottom: 28, fontSize: type.b2.fontSize, lineHeight: type.b2.lineHeight },
  noteFlush: { paddingBottom: 0 },
  meta: { fontSize: type.c1.fontSize, lineHeight: type.c1.lineHeight },
  host: { fontSize: type.c2.fontSize, lineHeight: type.c2.lineHeight },
  header: (insetTop: number) => ({ flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], paddingTop: insetTop + 14, paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[1] }),
  title: { flex: 1, textAlign: 'center' },
  titleXl: { fontSize: 22, lineHeight: 30 },
  spacer: (control: number) => ({ width: FIELD, height: control }),
  preview: { marginTop: 'auto', alignItems: 'center', gap: theme.spacing[2], paddingTop: 2, paddingHorizontal: theme.spacing[6] },
  previewNameWrap: { width: '100%', maxWidth: 320, alignItems: 'center' },
  previewName: { fontSize: 24, lineHeight: 32, textAlign: 'center' },
  previewSub: { fontSize: PREVIEW_SUB, lineHeight: PREVIEW_SUB_LINE, textAlign: 'center' },
  searchContent: (justifyContent: 'center' | 'flex-start' | 'flex-end') => ({ flexGrow: 1, justifyContent }),
  linkWait: { gap: theme.spacing[2], paddingTop: 14, paddingHorizontal: theme.spacing[5], paddingBottom: BAR },
  bar: (width: `${number}%`) => ({ width, height: 12, borderRadius: BAR, backgroundColor: theme.colors.fill }),
  searchBar: (insetBottom: number) => ({ flexDirection: 'row', alignItems: 'center', gap: 10, paddingTop: theme.spacing[2], paddingHorizontal: theme.spacing[4], paddingBottom: 10 + insetBottom }),
  input: (fontSize: number) => ({ flex: 1, color: theme.colors.t1, fontSize, letterSpacing: (type.b1.letterSpacing / type.b1.fontSize) * fontSize, paddingVertical: 0 }),
  footer: (insetBottom: number) => ({ gap: theme.spacing[2], paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[4], paddingBottom: insetBottom + theme.spacing[2] }),
  limitContent: { paddingTop: theme.spacing[1], paddingHorizontal: theme.spacing[4], paddingBottom: theme.spacing[6] },
  limitActions: (insetBottom: number) => ({ gap: theme.spacing[2], paddingTop: theme.spacing[3], paddingHorizontal: theme.spacing[4], paddingBottom: insetBottom + theme.spacing[2] }),
  mainContent: { flexGrow: 1, gap: 28, paddingTop: theme.spacing[1] },
  swatchWrap: { marginBottom: 'auto' },
  fieldWrap: { paddingTop: 28, paddingBottom: theme.spacing[3] },
}))

const BotNewSheetWithXlChrome = (props: Props) => (
  <XlBoardChrome>
    <BotNewSheet {...props} />
  </XlBoardChrome>
)

export default BotNewSheetWithXlChrome
