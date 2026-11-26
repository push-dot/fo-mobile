import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import { profileShareMessage } from '@/features/hub'
import { Badge, Button, Icon, SkeletonRows, Text } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { radius, spacing } from '../../../theme'
import { useMyProfile } from '../api/hooks'
import { CAREER_STATUSES, JOB_CATEGORIES, PROFILE_ACTIONS_TOP, PROFILE_NAME_TOP } from '../constants'
import type { ProfileSection } from '../types'
import { careerPeriod, profileCountLabels, tenureLabel } from '../utils'
import Avatar from './avatar'


const LOADING_ROWS = {
  count: 4,
  lead: { size: 48, radius: radius.pill },
  lines: [
    { width: '60%', height: 16 },
    { width: '40%', height: 12 },
  ],
} as const

const DETAIL_TOP = spacing[6] - 17

const edit = (s: ProfileSection) => router.push(`/edit-profile/${s}`)

const Section = ({
  title,
  onEdit,
  gap,
  children,
}: {
  title: string
  onEdit: () => void
  gap: number
  children: ReactNode
}) => {
  return (
    <View style={styles.section(gap)}>
      <View style={styles.sectionHead}>
        <Text v="h3" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 편집`}
          onPress={onEdit}
          style={styles.edit}
        >
          <Icon name="edit" size={18} color="t3" />
        </Pressable>
      </View>
      {children}
    </View>
  )
}

const ProfileTab = ({ share = true, onExport, exporting }: { share?: boolean; onExport?: () => void; exporting?: boolean }) => {
  const { data: p, isLoading } = useMyProfile()
  if (isLoading || !p) return <SkeletonRows {...LOADING_ROWS} />
  const job = JOB_CATEGORIES.find((j) => j.key === p.jobCategory)?.label ?? ''
  const status = CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label ?? ''

  return (
    <View style={[styles.tab, !share && styles.tabDetail]}>
      <View style={styles.hero}>
        <Avatar name={p.displayName} url={p.avatarUrl} size={84} />
        <Text v="h1" style={styles.name}>
          {p.displayName}
        </Text>
        {p.headline ? (
          <Text v="b2" color="t2" style={styles.headline}>
            {p.headline}
          </Text>
        ) : null}
        <View style={styles.badges}>
          {job || p.tenureYears != null ? <Badge label={[job, tenureLabel(p.tenureYears)].filter(Boolean).join(' · ')} /> : null}
          {status ? <Badge label={status} /> : null}
        </View>
        <View style={styles.counts}>
          {(
            [
              [profileCountLabels(p).following, '/activity/follows', 'following'],
              [profileCountLabels(p).followers, '/activity/follows', 'followers'],
              [profileCountLabels(p).posts, '/activity/posts', 'mine'],
            ] as const
          ).map(([{ count, label }, pathname, box]) => (
            <Pressable
              key={label}
              accessibilityRole="button"
              onPress={() => router.push({ pathname, params: { box } })}
            >
              <Text v="b2" color="t2">
                <Text v="b2" weight="700">
                  {count}
                </Text>{' '}
                {label}
              </Text>
            </Pressable>
          ))}
        </View>
        <View style={styles.actions}>
          <Button label="기본 정보 편집" variant="secondary" size="sm" paddingX={spacing[4]} onPress={() => edit('basic')} />
          {onExport ? <Button label="내보내기" variant="secondary" size="sm" paddingX={spacing[4]} pending={exporting} onPress={onExport} /> : null}
          {share ? (
            <Button label="공유" variant="secondary" size="sm" paddingX={spacing[4]} onPress={() => void shareMessage({ message: profileShareMessage(p.userId, p) })} />
          ) : null}
        </View>
      </View>

      <Section title="소개" onEdit={() => edit('intro')} gap={spacing[2]}>
        <Text v="b2" color={p.intro ? 't2' : 't3'}>
          {p.intro || '아직 소개가 없어요. 3~4문장으로 나를 소개해 보세요.'}
        </Text>
      </Section>

      <Section title="경력" onEdit={() => edit('career')} gap={spacing[3]}>
        {p.careers.length === 0 ? (
          <Text v="b2" color="t3">
            아직 등록한 경력이 없어요.
          </Text>
        ) : (
          p.careers.map((cr, i) => {
            const last = i === p.careers.length - 1
            return (
              <View key={`${cr.company}-${i}`} style={styles.career}>
                <View style={styles.rail}>
                  <View style={[styles.marker, !!cr.endedOn && styles.markerEnded]} />
                  {!last ? (
                    <View style={styles.railLine} />
                  ) : null}
                </View>
                <View style={[styles.careerBody, last && styles.careerBodyLast]}>
                  <Text v="b1" weight="700">
                    {cr.company} · {cr.role}
                  </Text>
                  <Text v="c1" color="t3">
                    {careerPeriod(cr)}
                  </Text>
                  {cr.description ? (
                    <Text v="b2" color="t2" style={styles.description}>
                      {cr.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          })
        )}
      </Section>

      <Section title="기술 스택" onEdit={() => edit('skills')} gap={spacing[3]}>
        {p.skills.length === 0 ? (
          <Text v="b2" color="t3">
            아직 등록한 기술이 없어요.
          </Text>
        ) : (
          <View style={styles.skills}>
            {p.skills.map((s) => (
              <Badge key={s} label={s} />
            ))}
          </View>
        )}
      </Section>
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  section: (gap: number) => ({ paddingHorizontal: theme.spacing[5], gap }),
  sectionHead: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  edit: { width: 44, height: 44, margin: -6, alignItems: 'center', justifyContent: 'center' },
  tab: { gap: theme.spacing[6], paddingTop: theme.spacing[6], paddingBottom: theme.spacing[6] },
  tabDetail: { paddingTop: DETAIL_TOP },
  hero: { alignItems: 'center', gap: theme.spacing[2], paddingHorizontal: theme.spacing[5] },
  name: { marginTop: PROFILE_NAME_TOP },
  headline: { textAlign: 'center' },
  badges: { flexDirection: 'row', gap: theme.spacing[2], marginTop: theme.spacing[1] },
  counts: { flexDirection: 'row', gap: theme.spacing[4], marginTop: theme.spacing[2] },
  actions: { flexDirection: 'row', alignItems: 'center', gap: theme.spacing[2], marginTop: PROFILE_ACTIONS_TOP },
  career: { flexDirection: 'row', gap: theme.spacing[4] },
  rail: { alignItems: 'center', paddingTop: theme.spacing[2] },
  marker: { width: 10, height: 10, borderRadius: theme.radius.xs, backgroundColor: theme.colors.ac },
  markerEnded: { backgroundColor: theme.colors.t4 },
  railLine: { flex: 1, width: 2, backgroundColor: theme.colors.line, marginTop: theme.spacing[1] },
  careerBody: { flex: 1, paddingBottom: theme.spacing[3] },
  careerBodyLast: { paddingBottom: 0 },
  description: { marginTop: theme.spacing[1] },
  skills: { flexDirection: 'row', flexWrap: 'wrap', gap: theme.spacing[2] },
}))

export default ProfileTab
