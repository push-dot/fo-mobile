import { useEffect, useState } from 'react'
import { Keyboard, Platform, Pressable, View } from 'react-native'
import { router } from 'expo-router'
import {
  AccountPill,
  CHANGE_NUMBER,
  CONFIRM,
  OTP_EXPIRED,
  OTP_INVALID,
  OTP_SENT_SUFFIX,
  OTP_TITLE,
  OtpBoxes,
  OtpCells,
  RESEND_CODE,
  TOO_MANY_BODY,
  TOO_MANY_TITLE,
  countdownLabel,
  formatNational,
  mapPhoneAuthError,
  otpErrorAfterInput,
  otpResendSlot,
  needsTerms,
  phoneFailureLine,
  readConsents,
  sendPhoneCode,
  toE164,
  useCountdown,
  usePhoneAuth,
  verifyPhoneCode,
} from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { Button, CtaBar, Text, TopBar, useKeyboardHeight } from '@/shared/components'
import { StyleSheet } from 'react-native-unistyles'

const OtpScreen = () => {
  const keyboard = useKeyboardHeight()
  const digits = usePhoneAuth((state) => state.digits)
  const email = usePhoneAuth((state) => state.email)
  const provider = usePhoneAuth((state) => state.provider)
  const pendingToken = usePhoneAuth((state) => state.pendingToken)
  const cooldownEndsAt = usePhoneAuth((state) => state.cooldownEndsAt)
  const setCooldown = usePhoneAuth((state) => state.setCooldown)
  const hold = usePhoneAuth((state) => state.hold)
  const clear = usePhoneAuth((state) => state.clear)
  const remaining = useCountdown(cooldownEndsAt)
  const [code, setCode] = useState('')
  const [busy, setBusy] = useState(false)
  const [blocked, setBlocked] = useState(false)
  const [otpError, setOtpError] = useState<'invalid' | 'expired' | null>(null)
  const [error, setError] = useState<string | null>(null)
  const e164 = toE164(digits)
  const display = formatNational(digits)

  const sent = cooldownEndsAt !== null
  useEffect(() => {
    if (!e164 || !sent) router.replace('/phone')
  }, [e164, sent])

  const resend = () => {
    if (!e164) return
    setBusy(true)
    setError(null)
    const before = otpError
    setOtpError(null)
    sendPhoneCode(e164)
      .then((sent) => {
        setCooldown(Date.now() + sent.cooldownSeconds * 1000)
        setBlocked(false)
        setCode('')
      })
      .catch((caught: unknown) => {
        setOtpError(before)
        const mapped = mapPhoneAuthError(caught)
        if (mapped.kind === 'cooldown') {
          setCooldown(Date.now() + mapped.retryAfterSec * 1000)
          return
        }
        setError(phoneFailureLine(mapped))
      })
      .finally(() => setBusy(false))
  }

  const confirm = () => {
    if (!e164 || code.length !== 6) return
    setBusy(true)
    setError(null)
    setOtpError(null)
    verifyPhoneCode({ phone: e164, code, pendingToken: pendingToken ?? undefined })
      .then(async (session) => {
        const consent = await readConsents(session.accessToken)
        if (needsTerms(consent)) {
          hold(session)
          router.push('/signup-terms')
          return
        }
        await useSession.getState().set(session)
        clear()
      })
      .catch((caught: unknown) => {
        const mapped = mapPhoneAuthError(caught)
        if (mapped.kind === 'too-many') {
          setBlocked(true)
          return
        }
        if (mapped.kind === 'invalid') setOtpError('invalid')
        else if (mapped.kind === 'expired') setOtpError('expired')
        else if (mapped.kind === 'cooldown') setCooldown(Date.now() + mapped.retryAfterSec * 1000)
        else setError(phoneFailureLine(mapped))
      })
      .finally(() => setBusy(false))
  }

  const notice = otpError === 'invalid' ? OTP_INVALID : otpError === 'expired' ? OTP_EXPIRED : error

  const status =
    otpResendSlot(remaining) === 'countdown' ? (
      <Text v="c1" weight="600" color="t2" style={styles.countdown}>
        {countdownLabel(remaining)}
      </Text>
    ) : (
      <Pressable accessibilityRole="button" disabled={busy} onPress={resend} style={styles.flex}>
        <Text v="c1" weight="700" color="acText">
          {RESEND_CODE}
        </Text>
      </Pressable>
    )

  if (!e164 || !sent) return null

  if (blocked) {
    return (
      <View style={styles.screen}>
        <TopBar onBack={() => router.back()} />
        <View style={styles.body}>
          <Text accessibilityRole="header" v="h1" style={styles.title}>
            {TOO_MANY_TITLE}
          </Text>
          <Text v="b2" color="t2" style={styles.subtitle}>
            {TOO_MANY_BODY}
          </Text>
          <View style={[styles.cells, styles.cellsBlocked]}>
            <OtpBoxes value="" active={null} />
          </View>
        </View>
        <CtaBar>
          <Button label={RESEND_CODE} disabled={busy} onPress={resend} style={styles.flex} />
        </CtaBar>
      </View>
    )
  }

  return (
    <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.screen}>
      <TopBar onBack={() => router.back()} />
      <Pressable accessible={false} onPress={Keyboard.dismiss} style={styles.body}>
        {email ? (
          <View style={styles.pill}>
            <AccountPill email={email} provider={provider} />
          </View>
        ) : null}
        <Text accessibilityRole="header" v="h1" style={styles.title}>
          {OTP_TITLE}
        </Text>
        <Text v="b2" color="t2" style={styles.subtitle}>
          <Text v="b2" weight="700" style={styles.tabular}>
            {display}
          </Text>
          {OTP_SENT_SUFFIX}
        </Text>
        <View style={styles.cells}>
          <OtpCells
            value={code}
            error={otpError === 'invalid'}
            onChange={(next) => {
              setOtpError((e) => otpErrorAfterInput(e, code, next))
              setCode(next)
            }}
          />
        </View>
        {notice && Platform.OS === 'ios' ? (
          <Text v="c1" color="red" accessibilityRole="alert" style={styles.notice}>
            {notice}
          </Text>
        ) : null}
        <View style={[styles.statusRow, notice && Platform.OS === 'ios' && styles.statusRowTight]}>
          {notice && Platform.OS === 'android' ? (
            <Text v="c1" weight="600" color="red" accessibilityRole="alert" style={styles.flex}>
              {notice}
            </Text>
          ) : (
            status
          )}
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
            <Text v="c1" weight="600" color="t2">
              {CHANGE_NUMBER}
            </Text>
          </Pressable>
        </View>
      </Pressable>
      <CtaBar lift={keyboard}>
        {otpError === 'expired' ? (
          <Button label={RESEND_CODE} disabled={busy} onPress={resend} style={styles.flex} />
        ) : (
          <Button label={CONFIRM} disabled={busy || code.length !== 6} onPress={confirm} style={styles.flex} />
        )}
      </CtaBar>
    </Pressable>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[3] },
  title: { fontSize: 24, lineHeight: 33 },
  subtitle: { marginTop: theme.spacing[2] },
  cells: { marginTop: 28 },
  cellsBlocked: { opacity: 0.5 },
  pill: { marginBottom: 18 },
  tabular: { fontVariant: ['tabular-nums'] },
  countdown: { flex: 1, fontVariant: ['tabular-nums'] },
  notice: { marginTop: theme.spacing[4] },
  statusRow: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3], marginTop: theme.spacing[4] },
  statusRowTight: { marginTop: 10 },
  flex: { flex: 1 },
}))

export default OtpScreen
