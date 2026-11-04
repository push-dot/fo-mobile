import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import {
  CHANGE_NUMBER,
  CONFIRM,
  OTP_EXPIRED,
  OTP_INVALID,
  OTP_TITLE,
  OtpCells,
  RESEND_CODE,
  TOO_MANY_BODY,
  TOO_MANY_TITLE,
  countdownLabel,
  formatNational,
  mapPhoneAuthError,
  needsTerms,
  otpSentLine,
  phoneFailureLine,
  readConsents,
  sendPhoneCode,
  toE164,
  useCountdown,
  usePhoneAuth,
  verifyPhoneCode,
} from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { Button, Text, TopBar } from '@/shared/components'
import { useColors } from '@/theme'
import { useSafeAreaInsets } from 'react-native-safe-area-context'

const OtpScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const digits = usePhoneAuth((state) => state.digits)
  const pendingToken = usePhoneAuth((state) => state.pendingToken)
  const cooldownEndsAt = usePhoneAuth((state) => state.cooldownEndsAt)
  const setCooldown = usePhoneAuth((state) => state.setCooldown)
  const setProviders = usePhoneAuth((state) => state.setProviders)
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

  useEffect(() => {
    if (!e164) router.replace('/phone')
  }, [e164])

  const resend = () => {
    if (!e164 || remaining > 0) return
    setBusy(true)
    setError(null)
    sendPhoneCode(e164)
      .then((sent) => {
        setCooldown(Date.now() + sent.cooldownSeconds * 1000)
        setBlocked(false)
        setOtpError(null)
        setCode('')
      })
      .catch((caught: unknown) => {
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
        if (mapped.kind === 'registered') {
          setProviders(mapped.providers)
          router.push('/phone-registered')
          return
        }
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

  if (blocked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        <View style={{ paddingHorizontal: 24, paddingTop: 24, gap: 10 }}>
          <Text accessibilityRole="header" v="h1">
            {TOO_MANY_TITLE}
          </Text>
          <Text v="b2" color="t3">
            {TOO_MANY_BODY}
          </Text>
          {remaining > 0 ? (
            <Text v="c1" color="t3">
              {countdownLabel(remaining)}
            </Text>
          ) : null}
          {error ? (
            <Text v="c1" color="red" accessibilityRole="alert">
              {error}
            </Text>
          ) : null}
        </View>
        <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16 }}>
          <Button label={RESEND_CODE} disabled={busy || remaining > 0} onPress={resend} />
        </View>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <View style={{ paddingHorizontal: 24, paddingTop: 12, gap: 10 }}>
        <Text accessibilityRole="header" v="h1">
          {OTP_TITLE}
        </Text>
        <Text v="b2" color="t3">
          {otpSentLine(display)}
        </Text>
        <View style={{ marginTop: 18 }}>
          <OtpCells
            value={code}
            onChange={(next) => {
              setCode(next)
              setOtpError(null)
            }}
          />
        </View>
        {otpError === 'invalid' ? (
          <Text v="c1" color="red" accessibilityRole="alert">
            {OTP_INVALID}
          </Text>
        ) : null}
        {otpError === 'expired' ? (
          <Text v="c1" color="red" accessibilityRole="alert">
            {OTP_EXPIRED}
          </Text>
        ) : null}
        {error ? (
          <Text v="c1" color="red" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
        {remaining > 0 ? (
          <Text v="c1" color="t3">
            {countdownLabel(remaining)}
          </Text>
        ) : otpError === 'expired' ? null : (
          <Pressable accessibilityRole="button" disabled={busy} onPress={resend}>
            <Text v="c1" weight="700" color="acText">
              {RESEND_CODE}
            </Text>
          </Pressable>
        )}
      </View>
      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 16, gap: 10 }}>
        <Pressable accessibilityRole="button" onPress={() => router.back()} style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}>
          <Text v="b2" weight="700" color="t2">
            {CHANGE_NUMBER}
          </Text>
        </Pressable>
        {otpError === 'expired' ? (
          <Button label={RESEND_CODE} disabled={busy || remaining > 0} onPress={resend} />
        ) : (
          <Button label={CONFIRM} disabled={busy || code.length !== 6} onPress={confirm} />
        )}
      </View>
    </View>
  )
}

export default OtpScreen
