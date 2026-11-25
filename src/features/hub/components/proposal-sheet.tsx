import { brandColor } from '@push/shared'
import { Platform, ScrollView, View, type LayoutChangeEvent } from 'react-native'
import { Chip, SheetScroll, Text, TextField } from '../../../shared/components'
import { StyleSheet } from 'react-native-unistyles'
import { onAccent, spacing } from '../../../theme'
import { PROPOSAL_MAX } from '../constants'
import Avatar from './avatar'

type Posting = { id: string; company: string; title: string }

type Props = {
  name: string
  subtitle: string
  message: string
  postingId?: string
  postings: Posting[]
  maxHeight: number
  onScrollLayout: (e: LayoutChangeEvent) => void
  error: string | null
  onMessage: (message: string) => void
  onPosting: (id: string | undefined) => void
  onError: (message: string | null) => void
}

const bleed = Platform.OS === 'android' ? spacing[5] : spacing[4]

const ProposalSheet = ({ name, subtitle, message, postingId, postings, error, maxHeight, onScrollLayout, onMessage, onPosting, onError }: Props) => {
  return (
    <View style={styles.sheet}>
      <Text v="h2" accessibilityRole="header">
        제안하기
      </Text>
      <SheetScroll style={styles.scroll(maxHeight)} onLayout={onScrollLayout} contentContainerStyle={styles.sheet} keyboardShouldPersistTaps="handled" keyboardDismissMode="interactive">
      <View style={styles.to}>
        <Avatar name={name} size={44} />
        <View style={styles.flex}>
          <Text v="b1" weight="700">
            {name} 님에게
          </Text>
          <Text v="c1" color="t3">
            {subtitle}
          </Text>
        </View>
      </View>
      <TextField
        label="메시지"
        accessibilityLabel="메시지"
        multiline
        max={PROPOSAL_MAX}
        value={message}
        onChangeText={(t) => {
          onMessage(t)
          onError(null)
        }}
        placeholder="어떤 이야기를 나누고 싶은지 적어 주세요"
      />
      {postings.length ? (
        <View style={styles.postings}>
          <Text v="b2" weight="700">
            함께 보낼 우리 회사 공고 (선택)
          </Text>
          <ScrollView horizontal showsHorizontalScrollIndicator={false} style={styles.postingsScroll} contentContainerStyle={styles.postingsList}>
            {postings.map((p) => (
              <Chip
                key={p.id}
                check="end"
                leadInset={8}
                label={`${p.company} · ${p.title}`}
                lead={
                  <View style={styles.logo(brandColor(p.company))}>
                    <Text v="tab" weight="800" style={styles.logoText}>
                      {[...p.company][0]}
                    </Text>
                  </View>
                }
                on={postingId === p.id}
                onPress={() => onPosting(postingId === p.id ? undefined : p.id)}
              />
            ))}
          </ScrollView>
        </View>
      ) : null}
      <Text v="c1" color="t3">
        제안은 {name} 님의 알림과 메시지함으로 전달돼요.
      </Text>
      {error ? (
        <Text v="c1" color="red" accessibilityRole="alert">
          {error}
        </Text>
      ) : null}
      </SheetScroll>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  sheet: { gap: 14 },
  scroll: (maxHeight: number) => ({ maxHeight }),
  to: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[3] },
  flex: { flex: 1 },
  postings: { gap: theme.spacing[3] },
  postingsScroll: { marginRight: -bleed },
  postingsList: { gap: theme.spacing[2], paddingRight: bleed },
  logo: (backgroundColor: string) => ({ width: 24, height: 24, borderRadius: 8, backgroundColor, alignItems: 'center', justifyContent: 'center' }),
  logoText: { color: onAccent },
}))

export default ProposalSheet
