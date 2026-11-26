import { router, useNavigation } from 'expo-router'
import { useEffect, useRef } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { Sheet, SheetScroll, Text, useSheetScrollMax } from '@/shared/components'
import { CHOICE_HANDOFF_MS, CONSENT_DETAIL_LABEL, CONSENT_LATER_LABEL, useConsentModal } from '@/shared/navigation'

const ConsentSheetScreen = () => {
  const request = useConsentModal((s) => s.request)
  const bound = useSheetScrollMax()
  const agreed = useRef(false)
  const onLater = request?.onLater
  const required = !!request && !onLater
  const onClose = onLater ?? request?.onDismiss
  const navigation = useNavigation()
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  useEffect(() => {
    navigation.setOptions({ gestureEnabled: !required })
  }, [navigation, required])
  useEffect(
    () => () => {
      if (!agreed.current) onClose?.()
    },
    [onClose],
  )
  if (!request) return null
  const agree = () => {
    if (agreed.current) return
    agreed.current = true
    router.back()
    setTimeout(request.onAgree, CHOICE_HANDOFF_MS)
  }
  return (
    <Sheet onLayout={bound.onSheetLayout} gap={12} actionGap={12} secondaryGap={8} action={{ label: request.agree, onPress: agree }} secondary={required ? undefined : { label: CONSENT_LATER_LABEL, onPress: () => router.back() }}>
      <View style={styles.body}>
        <Text v="h2" accessibilityRole="header" style={styles.title}>
          {request.title}
        </Text>
        <SheetScroll style={styles.scroll(bound.maxHeight)} onLayout={bound.onScrollLayout}>
          <Text v="b2" color="t2">
            {request.body}
          </Text>
        </SheetScroll>
      </View>
      <Pressable
        accessibilityRole="link"
        accessibilityLabel={CONSENT_DETAIL_LABEL}
        hitSlop={12}
        onPress={() => router.push({ pathname: '/(app)/(stack)/terms-view', params: { term: 'privacyPolicy' } })}
        style={styles.detail}
      >
        <Text v="c1" weight="600" style={styles.underline}>
          {CONSENT_DETAIL_LABEL}
        </Text>
      </Pressable>
    </Sheet>
  )
}

const styles = StyleSheet.create((theme) => ({
  body: { gap: theme.spacing[3] },
  title: { paddingTop: theme.spacing[1] },
  scroll: (maxHeight: number | undefined) => ({ maxHeight }),
  detail: { alignSelf: 'flex-start', marginTop: 5 },
  underline: { textDecorationLine: 'underline' },
}))

export default ConsentSheetScreen
