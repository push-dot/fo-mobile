import { router } from 'expo-router'
import { useEffect, useRef } from 'react'
import { materialPickerPath, type BotId } from '@/features/bots'
import { useBookmarkList } from '@/features/my'
import { showToast } from '@/shared/components'
import { showChoiceModal } from '@/shared/navigation'
import { displayName } from '@/shared/utility/display-name'
import { useChatDocs } from '../api/hooks'
import { TRY_LATER } from '../constants'
import { appendDraftText } from '../stores'
import { attachPickedFile } from '../utils/pick-file'
import { docMeta, postingMeta } from '../utils/quick-start-data'

const RECENT = 3
const SEE_ALL = '전체 보기'

export const useMaterialChange = (botId: string, onSay: () => void, enabled: boolean) => {
  const docs = useChatDocs(enabled)
  const bookmarks = useBookmarkList(enabled)
  const latest = useRef({ onSay, docs: docs.data, bookmarks: bookmarks.data?.data })
  useEffect(() => {
    latest.current = { onSay, docs: docs.data, bookmarks: bookmarks.data?.data }
  })
  return (title: string) => {
    const now = () => latest.current
    const say = () => now().onSay()
    const list = (heading: string, empty: string, rows: { label: string; sub: string }[]) => {
      showChoiceModal({
        title: heading,
        ...(rows.length ? {} : { message: empty }),
        items: [
          ...rows.slice(0, RECENT).map((r) => ({
            label: r.label,
            sub: r.sub,
            onPress: () => {
              appendDraftText(botId, r.label)
              say()
            },
          })),
          ...(rows.length > RECENT
            ? [
                {
                  label: SEE_ALL,
                  chevron: true,
                  onPress: () => {
                    say()
                    router.push(materialPickerPath(botId as BotId))
                  },
                },
              ]
            : []),
        ],
        onDismiss: say,
      })
    }
    showChoiceModal({
      title: '어떤 자료로 바꿀까요?',
      message: displayName(title),
      items: [
        {
          label: '내 서류에서',
          chevron: true,
          onPress: () => list('내 서류', '올린 서류가 아직 없어요', (now().docs ?? []).map((d) => ({ label: displayName(d.fileName), sub: docMeta(d) }))),
        },
        {
          label: '북마크한 공고에서',
          chevron: true,
          onPress: () => list('북마크한 공고', '북마크한 공고가 아직 없어요', (now().bookmarks ?? []).map((p) => ({ label: `${p.company} · ${p.title}`, sub: postingMeta(p) }))),
        },
        {
          label: '파일에서 고르기',
          onPress: () =>
            void attachPickedFile(botId).then(say, () => {
              showToast({ message: TRY_LATER })
              say()
            }),
        },
        {
          label: '링크 붙여넣기',
          chevron: true,
          onPress: () =>
            showChoiceModal({
              title: '링크를 붙여넣어 주세요',
              input: {
                placeholder: 'https://',
                confirm: '넣기',
                keyboardType: 'url',
                onSubmit: (text) => {
                  appendDraftText(botId, text)
                  say()
                },
              },
              onDismiss: say,
            }),
        },
      ],
      onDismiss: say,
    })
  }
}
