import { useState } from 'react'
import { Pressable, useWindowDimensions, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import { router } from 'expo-router'
import {
  APPLE,
  APPLE_BG,
  APPLE_START,
  GITHUB,
  GITHUB_BG,
  GITHUB_START,
  COMPACT_HEIGHT,
  GOOGLE,
  GOOGLE_START,
  LOGO_LABEL,
  LOGO_SIZE,
  LOGO_SIZE_COMPACT,
  LOGO_TOP,
  LOGO_TOP_COMPACT,
  PHONE_START,
  ProviderButton,
  emailFromPendingToken,
  loginFailureCopy,
  useAppleSignIn,
  usePhoneAuth,
  type LoginProvider,
} from '@/features/auth'
import { DEV_AUTH_TOKEN, signIn, signInWithApple, signInWithDevToken, type SignInOutcome } from '@/shared/infrastructure'
import { Mascot, Text } from '@/shared/components'
import { radius, useColors } from '@/theme'

const devToken = __DEV__ ? DEV_AUTH_TOKEN : undefined

const continueWith = (provider: LoginProvider, outcome: SignInOutcome) => {
  if (outcome.kind !== 'phone') return
  usePhoneAuth.getState().beginSocial(outcome.pendingToken, emailFromPendingToken(outcome.pendingToken), provider)
  router.push('/phone')
}

const SignInScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
  const compact = useWindowDimensions().height < COMPACT_HEIGHT
  const apple = useAppleSignIn()
  const [busy, setBusy] = useState(false)
  const [failure, setFailure] = useState<{ title: string; body: string } | null>(null)

  const run = (provider: LoginProvider) => {
    setBusy(true)
    setFailure(null)
    const attempt = provider === 'apple' ? signInWithApple() : signIn(provider)
    attempt
      .then((outcome) => {
        if (outcome.kind === 'cancelled') return
        if (outcome.kind === 'failed') {
          setFailure(loginFailureCopy(provider))
          return
        }
        continueWith(provider, outcome)
      })
      .catch(() => setFailure(loginFailureCopy(provider)))
      .finally(() => setBusy(false))
  }

  const startPhone = () => {
    usePhoneAuth.getState().beginPhone()
    router.push('/phone')
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <View style={{ marginTop: insets.top + (compact ? LOGO_TOP_COMPACT : LOGO_TOP), alignItems: 'center', gap: 20, paddingHorizontal: 28 }}>
        <View accessible accessibilityRole="image" accessibilityLabel={LOGO_LABEL} style={{ marginBottom: 10 }}>
          <Mascot size={compact ? LOGO_SIZE_COMPACT : LOGO_SIZE} />
        </View>
        <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 33, textAlign: 'center' }}>
          {'AI와 함께 하는 커리어,\nPush에서 시작하기'}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 24, gap: 12 }}>
        <ProviderButton label={GOOGLE_START} logo={GOOGLE} bg={c.card} fg={c.t1} border={c.line} disabled={busy} onPress={() => run('google')} />
        {apple ? (
          <ProviderButton label={APPLE_START} logo={APPLE} bg={APPLE_BG} fg="#FFFFFF" disabled={busy} onPress={() => run('apple')} />
        ) : null}
        <ProviderButton label={GITHUB_START} logo={GITHUB} bg={GITHUB_BG} fg="#FFFFFF" disabled={busy} onPress={() => run('github')} />
        <Pressable
          accessibilityRole="button"
          disabled={busy}
          onPress={startPhone}
          style={{ alignSelf: 'center', minHeight: 44, paddingHorizontal: 16, justifyContent: 'center' }}
        >
          <Text weight="600" color="t2">
            {PHONE_START}
          </Text>
        </Pressable>
        {devToken ? (
          <Pressable
            accessibilityRole="button"
            style={{ minHeight: 44, alignItems: 'center', justifyContent: 'center' }}
            onPress={() => signInWithDevToken(devToken)}
          >
            <Text v="c1" weight="700" color="acText">
              개발 토큰으로 들어가기
            </Text>
          </Pressable>
        ) : null}
      </View>

      {failure ? (
        <View
          accessibilityRole="alert"
          style={{ position: 'absolute', left: 20, right: 20, top: insets.top + 16, flexDirection: 'row', alignItems: 'flex-start', gap: 12, padding: 16, borderRadius: radius.lg, backgroundColor: c.redSoft }}
        >
          <Text weight="800" color="red">
            !
          </Text>
          <View style={{ flex: 1, gap: 4 }}>
            <Text weight="700">{failure.title}</Text>
            <Text v="c1" color="t2">
              {failure.body}
            </Text>
          </View>
        </View>
      ) : null}
    </View>
  )
}

export default SignInScreen
