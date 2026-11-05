import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { Pressable, View } from 'react-native'
import { CAREER_STATUSES, JOB_CATEGORIES } from '@push/api-client'
import { profileShareMessage } from '@/features/hub'
import { Badge, Button, Icon, SkeletonRows, Text } from '@/shared/components'
import { shareMessage } from '@/shared/infrastructure'
import { radius, spacing, useColors } from '../../../theme'
import { useMyProfile } from '../api/hooks'
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
    <View style={{ paddingHorizontal: spacing[5], gap }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h3" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 편집`}
          onPress={onEdit}
          style={{ width: 44, height: 44, margin: -6, alignItems: 'center', justifyContent: 'center' }}
        >
          <Icon name="edit" size={18} color="t3" />
        </Pressable>
      </View>
      {children}
    </View>
  )
}

const ProfileTab = () => {
  const c = useColors()
  const { data: p, isLoading } = useMyProfile()
  if (isLoading || !p) return <SkeletonRows {...LOADING_ROWS} />
  const job = JOB_CATEGORIES.find((j) => j.key === p.jobCategory)?.label ?? ''
  const status = CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label ?? ''

  return (
    <View style={{ gap: spacing[6], paddingTop: spacing[6], paddingBottom: spacing[6] }}>
      <View style={{ alignItems: 'center', gap: spacing[2], paddingHorizontal: spacing[5] }}>
        <Avatar name={p.displayName} url={p.avatarUrl} size={84} />
        <Text v="h1">
          {p.displayName}
        </Text>
        {p.headline ? (
          <Text v="b2" color="t2" style={{ textAlign: 'center' }}>
            {p.headline}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: spacing[2] }}>
          {job || p.tenureYears != null ? <Badge label={[job, tenureLabel(p.tenureYears)].filter(Boolean).join(' · ')} tone="grey" /> : null}
          {status ? <Badge label={status} tone={p.careerStatus === 'seeking' ? 'ac' : 'grey'} /> : null}
        </View>
        <View style={{ flexDirection: 'row', gap: spacing[4], marginTop: spacing[2] }}>
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
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: spacing[2], marginTop: spacing[2] }}>
          <Button label="기본 정보 편집" icon="edit" variant="secondary" size="sm" onPress={() => edit('basic')} />
          <Button
            label="공유"
            icon="share"
            variant="secondary"
            size="sm"
            onPress={() => void shareMessage({ message: profileShareMessage(p.userId, p) })}
          />
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
              <View key={`${cr.company}-${i}`} style={{ flexDirection: 'row', gap: spacing[4] }}>
                <View style={{ alignItems: 'center', paddingTop: spacing[2] }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: radius.xs,
                      backgroundColor: cr.endedOn ? c.t4 : c.ac,
                    }}
                  />
                  {!last ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: c.line, marginTop: spacing[1] }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: last ? 0 : spacing[3] }}>
                  <Text v="b1" weight="700">
                    {cr.company} · {cr.role}
                  </Text>
                  <Text v="c1" color="t3">
                    {careerPeriod(cr)}
                  </Text>
                  {cr.description ? (
                    <Text v="b2" color="t2" style={{ marginTop: spacing[1] }}>
                      {cr.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          })
        )}
      </Section>

      <Section title="기술 스택" onEdit={() => edit('skills')} gap={spacing[2]}>
        {p.skills.length === 0 ? (
          <Text v="b2" color="t3">
            아직 등록한 기술이 없어요.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: spacing[2] }}>
            {p.skills.map((s) => (
              <Badge key={s} label={s} tone="grey" />
            ))}
          </View>
        )}
      </Section>
    </View>
  )
}

export default ProfileTab
