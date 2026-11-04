import { useState } from 'react'
import { Pressable, StyleSheet, View } from 'react-native'
import { useSafeAreaInsets } from 'react-native-safe-area-context'
import Svg, { Defs, RadialGradient, Rect, Stop } from 'react-native-svg'
import { router } from 'expo-router'
import {
  APPLE,
  APPLE_BG,
  APPLE_START,
  GITHUB,
  GITHUB_BG,
  GITHUB_START,
  GOOGLE,
  GOOGLE_START,
  PHONE_START,
  ProviderButton,
  emailFromPendingToken,
  loginFailureCopy,
  useAppleSignIn,
  usePhoneAuth,
  type LoginProvider,
} from '@/features/auth'
import { DEV_AUTH_TOKEN, signIn, signInWithApple, signInWithDevToken, type SignInOutcome } from '@/shared/infrastructure'
import { Button, Text } from '@/shared/components'
import { useColors } from '@/theme'

const devToken = __DEV__ ? DEV_AUTH_TOKEN : undefined

const continueWith = (outcome: SignInOutcome) => {
  if (outcome.kind !== 'phone') return
  usePhoneAuth.getState().beginSocial(outcome.pendingToken, emailFromPendingToken(outcome.pendingToken))
  router.push('/phone')
}

const SignInScreen = () => {
  const c = useColors()
  const insets = useSafeAreaInsets()
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
        continueWith(outcome)
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
      <Svg style={StyleSheet.absoluteFill} pointerEvents="none">
        <Defs>
          <RadialGradient id="glow" cx="50%" cy="0%" rx="120%" ry="60%" fx="50%" fy="0%">
            <Stop offset="0" stopColor={c.acSoft} stopOpacity={1} />
            <Stop offset="0.7" stopColor={c.acSoft} stopOpacity={0} />
          </RadialGradient>
        </Defs>
        <Rect width="100%" height="100%" fill="url(#glow)" />
      </Svg>

      <View style={{ marginTop: insets.top + 96, alignItems: 'center', gap: 14, paddingHorizontal: 28 }}>
        <Text accessibilityRole="header" weight="800" style={{ fontSize: 44, lineHeight: 48, letterSpacing: -2.2 }}>
          Push<Text weight="800" color="ac" style={{ fontSize: 44, lineHeight: 48 }}>.</Text>
        </Text>
        <Text v="h1" style={{ fontSize: 24, lineHeight: 33, textAlign: 'center' }}>
          {'공고에 맞는 이력서,\n대화로 만들어요'}
        </Text>
        <Text v="b2" color="t3" style={{ textAlign: 'center' }}>
          {'데스크톱 앱과 같은 계정으로 로그인하면\n대화와 서류가 그대로 이어져요.'}
        </Text>
      </View>

      <View style={{ position: 'absolute', left: 20, right: 20, bottom: insets.bottom + 24, gap: 10 }}>
        {failure ? (
          <View accessibilityRole="alert" style={{ gap: 4, marginBottom: 4 }}>
            <Text v="c1" weight="700" color="red" style={{ textAlign: 'center' }}>
              {failure.title}
            </Text>
            <Text v="c1" color="red" style={{ textAlign: 'center' }}>
              {failure.body}
            </Text>
          </View>
        ) : null}
        <ProviderButton label={GOOGLE_START} logo={GOOGLE} bg={c.card} fg={c.t1} border={c.line} disabled={busy} onPress={() => run('google')} />
        {apple ? (
          <ProviderButton label={APPLE_START} logo={APPLE} bg={APPLE_BG} fg="#FFFFFF" disabled={busy} onPress={() => run('apple')} />
        ) : null}
        <ProviderButton label={GITHUB_START} logo={GITHUB} bg={GITHUB_BG} fg="#FFFFFF" disabled={busy} onPress={() => run('github')} />
        <Button label={PHONE_START} variant="secondary" disabled={busy} onPress={startPhone} />
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
        <Text v="c2" color="t3" style={{ textAlign: 'center', marginTop: 6 }}>
          계속하면 이용약관과 개인정보 처리방침에 동의하게 돼요.
        </Text>
      </View>
    </View>
  )
}

export default SignInScreen
