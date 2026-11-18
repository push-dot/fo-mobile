import { router, useLocalSearchParams } from 'expo-router'
import { useEffect, useState } from 'react'
import { Alert } from 'react-native'
import { ApplySheet, applyBody, splitApplyDocs, useApplyDocs, useApplyPosting, usePosting } from '@/features/jobs'
import { Sheet, SheetScroll, TOAST_ABOVE, showToast, useSheetScrollMax } from '@/shared/components'

const param = (value: string | string[] | undefined) => (Array.isArray(value) ? value[0] : value)

const ApplySheetScreen = () => {
  const postingId = param(useLocalSearchParams<{ postingId?: string }>().postingId)
  const posting = usePosting(postingId ?? '')
  const docs = useApplyDocs(!!postingId).data ?? []
  const { main, extras } = splitApplyDocs(docs)
  const bound = useSheetScrollMax()
  const [picked, setPicked] = useState<string>()
  const [extraIds, setExtraIds] = useState<string[]>([])
  const doc = main.find((d) => d.id === picked) ?? main[0]
  const chosen = extras.filter((d) => extraIds.includes(d.id))
  const apply = useApplyPosting(postingId ?? '', () => {
    router.back()
    showToast({ message: '지원했어요', tone: 'success', bottom: TOAST_ABOVE.cta })
  })

  useEffect(() => {
    if (!postingId) router.back()
  }, [postingId])

  useEffect(() => {
    if (apply.isError) Alert.alert('지원하지 못했어요', '잠시 후 다시 눌러 주세요.', [{ text: '닫기', style: 'cancel' }])
  }, [apply.isError])

  if (!postingId) return null

  const p = posting.data
  return (
    <Sheet
      onLayout={bound.onSheetLayout}
      title="어떤 서류로 지원할까요?"
      description={p ? `${p.company} · ${p.title}` : undefined}
      action={{
        label: apply.isPending ? '지원하는 중…' : '이 서류로 지원하기',
        onPress: () => apply.mutate(applyBody(doc, chosen)),
        disabled: !doc,
        pending: apply.isPending,
      }}
    >
      <SheetScroll keyboardShouldPersistTaps="handled" style={{ maxHeight: bound.maxHeight }} onLayout={bound.onScrollLayout}>
        <ApplySheet
          main={main}
          extras={extras}
          pickedId={doc?.id}
          extraIds={extraIds}
          onPick={setPicked}
          onToggleExtra={(id) => setExtraIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]))}
        />
      </SheetScroll>
    </Sheet>
  )
}

export default ApplySheetScreen
