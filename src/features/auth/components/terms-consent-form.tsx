import { useCallback, useRef } from 'react'
import { Pressable, View } from 'react-native'
import { router, useFocusEffect } from 'expo-router'
import { StyleSheet } from 'react-native-unistyles'
import { Button, CtaBar, Text, TopBar } from '@/shared/components'
import {
  TERM_ROWS,
  TERMS_BODY,
  TERMS_OPTIONAL,
  TERMS_PRIVACY_POLICY,
  TERMS_REQUIRED,
  TERMS_START,
  TERMS_TITLE,
  isTermKey,
} from '../constants'
import { useTermsConsent } from '../stores'
import TermRow from './term-row'
import TermsAllRow from './terms-all-row'

type Props = {
  termsViewRoute: '/terms-view' | '/(app)/(stack)/terms-view'
  busy: boolean
  error: string | null
  onSubmit: (marketing: boolean) => void
  onBack?: () => void
  padRows?: boolean
}

const TermsConsentForm = ({ termsViewRoute, busy, error, onSubmit, onBack, padRows = false }: Props) => {
  const checked = useTermsConsent((state) => state.checked)
  const toggle = useTermsConsent((state) => state.toggle)
  const toggleAll = useTermsConsent((state) => state.toggleAll)
  const all = TERM_ROWS.every((row) => checked[row.id])
  const requiredOk = TERM_ROWS.filter((row) => row.required).every((row) => checked[row.id])

  const opening = useRef(false)
  useFocusEffect(
    useCallback(() => {
      opening.current = false
    }, []),
  )
  const openTerm = (term: string) => {
    if (opening.current) return
    opening.current = true
    router.push({ pathname: termsViewRoute, params: { term } })
  }

  const submit = () => {
    if (requiredOk) onSubmit(Boolean(checked.marketing))
  }

  return (
    <View style={styles.screen}>
      <TopBar onBack={onBack} />
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
        <View style={[styles.rows, padRows && styles.rowsPad]}>
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
        <Pressable accessibilityRole="link" onPress={() => openTerm('privacyPolicy')} style={styles.policy}>
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
  rows: { paddingTop: theme.spacing[2] },
  rowsPad: { paddingHorizontal: theme.spacing[4] },
  policy: { alignSelf: 'flex-start', minHeight: 44, justifyContent: 'center' },
  underline: { textDecorationLine: 'underline' },
  flex: { flex: 1 },
}))

export default TermsConsentForm
