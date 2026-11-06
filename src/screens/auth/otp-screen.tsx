import { useEffect, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router } from 'expo-router'
import {
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
import { Button, CtaBar, Text, TopBar } from '@/shared/components'
import { spacing, useColors } from '@/theme'

const OtpScreen = () => {
  const c = useColors()
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

  const notice = otpError === 'invalid' ? OTP_INVALID : otpError === 'expired' ? OTP_EXPIRED : error

  const status = notice ? (
    <Text v="c1" weight="600" color="red" accessibilityRole="alert" style={{ flex: 1 }}>
      {notice}
    </Text>
  ) : remaining > 0 ? (
    <Text v="c1" weight="600" color="t2" style={{ flex: 1, fontVariant: ['tabular-nums'] }}>
      {countdownLabel(remaining)}
    </Text>
  ) : (
    <Pressable accessibilityRole="button" disabled={busy} onPress={resend} style={{ flex: 1 }}>
      <Text v="c1" weight="700" color="acText">
        {RESEND_CODE}
      </Text>
    </Pressable>
  )

  if (blocked) {
    return (
      <View style={{ flex: 1, backgroundColor: c.bg }}>
        <TopBar onBack={() => router.back()} />
        <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3] }}>
          <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 33 }}>
            {TOO_MANY_TITLE}
          </Text>
          <Text v="b2" color="t2" style={{ marginTop: spacing[2] }}>
            {TOO_MANY_BODY}
          </Text>
          <View style={{ marginTop: 28, opacity: 0.5 }}>
            <OtpBoxes value="" active={null} />
          </View>
        </View>
        <CtaBar>
          <Button label={RESEND_CODE} disabled={busy} onPress={resend} style={{ flex: 1 }} />
        </CtaBar>
      </View>
    )
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar onBack={() => router.back()} />
      <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3] }}>
        <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 33 }}>
          {OTP_TITLE}
        </Text>
        <Text v="b2" color="t2" style={{ marginTop: spacing[2] }}>
          <Text v="b2" weight="700" style={{ fontVariant: ['tabular-nums'] }}>
            {display}
          </Text>
          {OTP_SENT_SUFFIX}
        </Text>
        <View style={{ marginTop: 28 }}>
          <OtpCells
            value={code}
            error={otpError === 'invalid'}
            onChange={(next) => {
              setOtpError((e) => otpErrorAfterInput(e, code, next))
              setCode(next)
            }}
          />
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[3], marginTop: spacing[4] }}>
          {status}
          <Pressable accessibilityRole="button" onPress={() => router.back()} hitSlop={12}>
            <Text v="c1" weight="600" color="t2">
              {CHANGE_NUMBER}
            </Text>
          </Pressable>
        </View>
      </View>
      <CtaBar>
        {otpError === 'expired' ? (
          <Button label={RESEND_CODE} disabled={busy} onPress={resend} style={{ flex: 1 }} />
        ) : (
          <Button label={CONFIRM} disabled={busy || code.length !== 6} onPress={confirm} style={{ flex: 1 }} />
        )}
      </CtaBar>
    </View>
  )
}

export default OtpScreen
