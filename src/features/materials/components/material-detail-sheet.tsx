import { ApiError } from '@push/api-client'
import { router } from 'expo-router'
import { useMemo } from 'react'
import { View } from 'react-native'
import {
  Button,
  GlassButton,
  Sheet,
  Spinner,
  Text,
  askConfirm,
  showToast,
} from '@/shared/components'
import { openUrl } from '@/shared/infrastructure'
import { radius, spacing, useColors } from '@/theme'
import { useDeleteMaterial, useMaterialDetail, useRestoreMaterial } from '../api/hooks'
import {
  CITED,
  DELETE_CONFIRM,
  DELETE_LABEL,
  LOAD_ERROR,
  OPEN_LABEL,
  RESTORE_FAILED,
  SEND_LABEL,
  UNDO_LABEL,
} from '../constants'
import type { Material, MaterialKind } from '../types'
import { deleteCopy, detailFacts, detailTitle, sendContextOf } from '../utils/material-view'
import { sendMaterial } from './send-material'
import { useSearchRoom } from './materials-search'

const KINDS: readonly MaterialKind[] = ['file', 'document', 'posting', 'link']
export const isMaterialKind = (value: string | undefined): value is MaterialKind =>
  KINDS.includes(value as MaterialKind)

/**
 * 서류로 들어가기, 공고로 이동, 바로가기. A link opens in the browser over the sheet. The others close the sheet and the modal
 * first, as the drawer's lists did: a full screen pushed inside a modal sheet would draw under its top inset.
 */
const open = (m: Material) => {
  if (m.kind === 'link') return void openUrl(m.url)
  router.dismiss(2)
  if (m.kind === 'posting') router.push(`/postings/${m.id}`)
  else if (m.kind === 'document') router.push(`/docs/push/${m.id}`)
  else router.push(`/docs/${m.id}`)
}

/** DELETE answers 409 for a file a career row still cites. */
const cited = (error: unknown) => error instanceof ApiError && error.status === 409

/** MaterialDetailDoc, MaterialDetailBookmark, MaterialDetailLink, MaterialDetailLong, MaterialDetailDelete. */
export const MaterialDetailSheet = ({
  kind,
  id,
  forBot,
}: {
  kind: MaterialKind
  id: string
  forBot?: string
}) => {
  const c = useColors()
  const detail = useMaterialDetail(kind, id)
  const remove = useDeleteMaterial()
  const restore = useRestoreMaterial()
  const now = useMemo(() => new Date(), [])
  const toastBottom = useSearchRoom().toast

  const m = detail.data?.material
  if (!m) {
    return (
      <Sheet>
        {detail.isError ? (
          <View
            accessibilityRole="alert"
            style={{ alignItems: 'center', gap: spacing[3], paddingVertical: spacing[6] }}
          >
            <Text v="b2" color="t3">
              {LOAD_ERROR.title}
            </Text>
            <Button
              label={LOAD_ERROR.retry}
              variant="secondary"
              size="sm"
              onPress={detail.refetch}
            />
          </View>
        ) : (
          <View style={{ alignItems: 'center', paddingVertical: spacing[6] }}>
            <Spinner />
          </View>
        )}
      </Sheet>
    )
  }

  const copy = deleteCopy(m)
  const onDelete = () => {
    router.back()
    remove(m.kind, m.id).then(
      () =>
        showToast({
          message: copy.done,
          bottom: toastBottom,
          action: {
            label: UNDO_LABEL,
            onPress: () =>
              void restore(m.kind, m.id).catch(() =>
                showToast({ message: RESTORE_FAILED, alert: true, bottom: toastBottom }),
              ),
          },
        }),
      (error: unknown) =>
        showToast({
          message: cited(error) ? CITED : copy.failed,
          alert: true,
          bottom: toastBottom,
        }),
    )
  }

  const facts = detailFacts(m, detail.data?.usedBy ?? [], now)

  return (
    <Sheet gap={14}>
      <View style={{ flexDirection: 'row', alignItems: 'flex-start', gap: spacing[3] }}>
        <Text v="h3" accessibilityRole="header" style={{ flex: 1, minWidth: 0, paddingTop: spacing[1] }}>
          {detailTitle(m)}
        </Text>
        <GlassButton
          circle
          iconSize={21}
          actions={[
            {
              icon: 'delete',
              label: DELETE_LABEL,
              color: 'red',
              onPress: () =>
                askConfirm({
                  title: copy.title,
                  body: copy.body,
                  confirm: DELETE_CONFIRM,
                  danger: true,
                  onConfirm: onDelete,
                }),
            },
          ]}
        />
      </View>
      <View
        style={{
          gap: spacing[2],
          paddingVertical: 14,
          paddingHorizontal: spacing[4],
          borderRadius: radius.card,
          backgroundColor: c.bg2,
        }}
      >
        {facts.map((f) => (
          <View key={f.label} style={{ flexDirection: 'row', gap: spacing[3] }}>
            <Text v="c1" color="t3" style={{ width: 72, fontSize: 14, lineHeight: 20 }}>
              {f.label}
            </Text>
            <Text v="c1" style={{ flex: 1, fontSize: 14, lineHeight: 20 }}>
              {f.value}
            </Text>
          </View>
        ))}
      </View>
      <View style={{ gap: spacing[2], marginTop: spacing[1] }}>
        <Button
          label={SEND_LABEL}
          onPress={() => {
            const context = sendContextOf(forBot)
            if (context.from === 'home') router.back()
            sendMaterial(context, m)
          }}
        />
        <Button label={OPEN_LABEL[m.kind]} variant="secondary" onPress={() => open(m)} />
      </View>
    </Sheet>
  )
}
