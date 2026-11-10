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
} from '@/features/auth'
import { useSession } from '@/shared/infrastructure'
import { Button, CtaBar, Text, TopBar, showToast } from '@/shared/components'
import { marketingResult } from '@/features/my'
import { spacing, useColors } from '@/theme'

const TERMS_VIEW_ROUTE = '/(app)/(stack)/terms-view' as const
const HOME_ROUTE = '/(app)/(stack)/(tabs)/(home)' as const

const ReconsentTermsScreen = () => {
  const c = useColors()
  const session = useSession((s) => s.session)
  const checked = useTermsConsent((state) => state.checked)
  const toggle = useTermsConsent((state) => state.toggle)
  const toggleAll = useTermsConsent((state) => state.toggleAll)
  const [busy, setBusy] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const all = TERM_ROWS.every((row) => checked[row.id])
  const requiredOk = TERM_ROWS.filter((row) => row.required).every((row) => checked[row.id])

  useEffect(() => {
    if (!session) router.replace(HOME_ROUTE)
  }, [session])

  useEffect(() => () => useTermsConsent.getState().reset(), [])

  const opening = useRef(false)
  useFocusEffect(
    useCallback(() => {
      opening.current = false
    }, []),
  )
  const openTerm = (term: string) => {
    if (opening.current) return
    opening.current = true
    router.push({ pathname: TERMS_VIEW_ROUTE, params: { term } })
  }

  const submit = () => {
    if (!session || !requiredOk) return
    setBusy(true)
    setError(null)
    const marketing = Boolean(checked.marketing)
    saveTerms(session.accessToken, marketing)
      .then((consent) => {
        if (marketing) showToast({ message: marketingResult(true, consent.terms?.marketingAt ?? null) })
        router.replace(HOME_ROUTE)
      })
      .catch(() => setError(TRY_AGAIN))
      .finally(() => setBusy(false))
  }

  return (
    <View style={{ flex: 1, backgroundColor: c.bg }}>
      <TopBar />
      <View style={{ paddingHorizontal: spacing[6], paddingTop: spacing[3] }}>
        <Text accessibilityRole="header" v="h1" style={{ fontSize: 24, lineHeight: 32 }}>
          {TERMS_TITLE}
        </Text>
        <Text v="b2" color="t2" style={{ marginTop: spacing[2] }}>
          {TERMS_BODY}
        </Text>
        <View style={{ marginTop: spacing[6] }}>
          <TermsAllRow checked={all} onPress={toggleAll} />
        </View>
        <View style={{ paddingTop: spacing[2] }}>
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
          style={{ alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' }}
        >
          <Text v="c1" color="t2" style={{ textDecorationLine: 'underline' }}>
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
        <Button label={TERMS_START} disabled={!requiredOk || busy} onPress={submit} style={{ flex: 1 }} />
      </CtaBar>
    </View>
  )
}

export default ReconsentTermsScreen
