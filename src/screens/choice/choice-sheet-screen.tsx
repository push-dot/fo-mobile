import { router } from 'expo-router'
import { useEffect, useRef, useState } from 'react'
import { Pressable, View } from 'react-native'
import { Sheet, Switch, Text } from '@/shared/components'
import { CHOICE_HANDOFF_MS, useChoiceModal } from '@/shared/navigation'
import { spacing, useColors } from '@/theme'

// .pm8: title 52 high, the body 4 under it (rows 6 apart, the message under the title), the button 14 under the last block.
const ChoiceSheetScreen = () => {
  const c = useColors()
  const request = useChoiceModal((s) => s.request)
  const picked = useRef(false)
  const form = request?.form
  const [selected, setSelected] = useState(form?.selected ?? 0)
  const [on, setOn] = useState(form?.toggle?.on ?? false)
  const onDismiss = request?.onDismiss
  useEffect(() => {
    if (!request) router.back()
  }, [request])
  useEffect(() => () => {
    if (!picked.current) onDismiss?.()
  }, [onDismiss])
  if (!request) return null
  const run = (onPress: () => void) => {
    picked.current = true
    router.back()
    setTimeout(onPress, CHOICE_HANDOFF_MS)
  }
  const confirm = form ? { label: form.confirmLabel(selected, on), onPress: () => form.onConfirm(selected, on) } : request.confirm
  const row = (last: boolean) => ({ minHeight: 50, flexDirection: 'row' as const, alignItems: 'center' as const, gap: spacing[3], paddingHorizontal: spacing[1], borderBottomWidth: last ? 0 : 1, borderBottomColor: c.line })
  return (
    <Sheet gap={4} actionGap={10} slimAction action={confirm ? { label: confirm.label, onPress: () => run(confirm.onPress) } : undefined}>
      <View style={{ minHeight: 52, justifyContent: 'center' }}>
        <Text v="h3" weight="600" accessibilityRole="header" style={{ textAlign: 'center' }}>
          {request.title}
        </Text>
      </View>
      {request.message ? (
        <Text v={request.items ? 'b2' : 'b1'} color="t2" style={{ paddingHorizontal: spacing[1] }}>
          {request.message}
        </Text>
      ) : null}
      {request.items ? (
        <View style={{ gap: 6 }}>
          {request.items.map((item, i) => (
            <Pressable key={item.label} accessibilityRole="button" onPress={() => run(item.onPress)} style={row(i === request.items!.length - 1)}>
              <Text v="h3" weight="400" color={item.destructive ? 'red' : 't1'} style={{ flex: 1 }}>
                {item.label}
              </Text>
              {item.chevron ? (
                <Text v="b2" color="t3">
                  ›
                </Text>
              ) : null}
            </Pressable>
          ))}
        </View>
      ) : null}
      {form ? (
        <View style={{ gap: 6 }}>
          {form.options.map((option, i) => (
            <Pressable key={option.label} accessibilityRole="radio" accessibilityState={{ selected: i === selected }} onPress={() => setSelected(i)} style={row(i === form.options.length - 1 && !form.toggle)}>
              <View style={{ flex: 1 }}>
                <Text v="h3" weight="400">
                  {option.label}
                </Text>
                {option.sub ? (
                  <Text v="c1" color="t3">
                    {option.sub}
                  </Text>
                ) : null}
              </View>
              {i === selected ? (
                <Text v="h3" weight="700" color="acText">
                  ✓
                </Text>
              ) : null}
            </Pressable>
          ))}
          {form.toggle ? (
            <View style={row(true)}>
              <Text v="h3" weight="400" style={{ flex: 1 }}>
                {form.toggle.label}
              </Text>
              <Switch value={on} onValueChange={setOn} label={form.toggle.label} />
            </View>
          ) : null}
        </View>
      ) : null}
    </Sheet>
  )
}

export default ChoiceSheetScreen
