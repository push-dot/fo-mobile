import { useCallback, useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import {
  TERM_ROWS,
  TERMS_BODY,
  TERMS_OPTIONAL,
  TERMS_PRIVACY_POLICY,
  TERMS_REQUIRED,
  TERMS_START,
  TERMS_TITLE,
  TRY_AGAIN,
  TermRow,
  TermsAllRow,
  isTermKey,
  saveTerms,
  useTermsConsent,
  usePhoneAuth,
} from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { Button, CtaBar, Text, TopBar, showToast } from '@/shared/components'
import { marketingResult } from '@/features/my'
import { StyleSheet } from 'react-native-unistyles'

const TermsScreen = () => {
  const held = usePhoneAuth((state) => state.held)
  const clear = usePhoneAuth((state) => state.clear)
  const checked = useTermsConsent((state) => state.checked)
  const toggle = useTermsConsent((state) => state.toggle)
  const toggleAll = useTermsConsent((state) => state.toggleAll)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = TERM_ROWS.every((row) => checked[row.id])
  const requiredOk = TERM_ROWS.filter((row) => row.required).every((row) => checked[row.id])

  useEffect(() => {
    if (!held) router.replace('/sign-in')
  }, [held])

  useEffect(
    () => () => {
      useTermsConsent.getState().reset()
      if (usePhoneAuth.getState().held) clear()
    },
    [clear],
  )

  const opening = useRef(false)
  useFocusEffect(
    useCallback(() => {
      opening.current = false
    }, []),
  )
  const leave = () => {
    if (held) clear()
    router.back()
  }

  const openTerm = (term: string) => {
    if (opening.current) return
    opening.current = true
    router.push({ pathname: '/terms-view', params: { term } })
  }

  const submit = () => {
    if (!held || !requiredOk) return
    setBusy(true)
    setError(null)
    const marketing = Boolean(checked.marketing)
    saveTerms(held.accessToken, marketing)
      .then(async (consent) => {
        if (marketing) showToast({ message: marketingResult(true, consent.terms?.marketingAt ?? null) })
        await useSession.getState().set(held)
        clear()
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return (
    <View style={styles.screen}>
      <TopBar onBack={leave} />
      <View style={styles.body}>
        <Text accessibilityRole="header" v="h1" style={styles.title}>
          {TERMS_TITLE}
        </Text>
        <Text v="b2" color="t2" style={styles.subtitle}>
          {TERMS_BODY}
        </Text>
        <View style={styles.all}>
          <TermsAllRow checked={all} onPress={toggleAll} />
        </View>
        <View style={styles.rows}>
          {TERM_ROWS.map((row) => (
            <TermRow
              key={row.id}
              label={row.label}
              badge={row.required ? TERMS_REQUIRED : TERMS_OPTIONAL}
              required={row.required}
              checked={Boolean(checked[row.id])}
              onPress={() => toggle(row.id)}
              onOpen={isTermKey(row.id) ? () => openTerm(row.id) : undefined}
            />
          ))}
        </View>
        <Pressable
          accessibilityRole="link"
          onPress={() => openTerm('privacyPolicy')}
          style={styles.policy}
        >
          <Text v="c2" color="t2" style={styles.underline}>
            {TERMS_PRIVACY_POLICY}
          </Text>
        </Pressable>
        {error ? (
          <Text v="c1" color="red" accessibilityRole="alert">
            {error}
          </Text>
        ) : null}
      </View>
      <CtaBar>
        <Button label={TERMS_START} disabled={!requiredOk || busy} onPress={submit} style={styles.flex} />
      </CtaBar>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, backgroundColor: theme.colors.bg },
  body: { paddingHorizontal: theme.spacing[6], paddingTop: theme.spacing[3] },
  title: { fontSize: 24, lineHeight: 32 },
  subtitle: { marginTop: theme.spacing[2] },
  all: { marginTop: theme.spacing[6] },
  rows: { paddingTop: theme.spacing[2], paddingHorizontal: theme.spacing[4] },
  policy: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  flex: { flex: 1 },
}))

export default TermsScreen
