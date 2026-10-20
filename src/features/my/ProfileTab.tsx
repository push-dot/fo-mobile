import { useQuery } from '@tanstack/react-query'
import { router } from 'expo-router'
import type { ReactNode } from 'react'
import { ActivityIndicator, Pressable, View } from 'react-native'
import { CAREER_STATUSES, JOB_CATEGORIES } from '@push/api-client'
import { api } from '../../lib/api'
import { useColors } from '../../theme'
import { Badge, Button, Icon, Text } from '../../ui'
import { careerPeriod, tenureLabel } from './lib'
import { Avatar } from './parts'

export type ProfileSection = 'basic' | 'intro' | 'career' | 'skills'
const edit = (s: ProfileSection) => router.push(`/edit-profile/${s}`)

export const useMyProfile = () => useQuery({ queryKey: ['me', 'profile'], queryFn: api.me.profile })

function Section({
  title,
  onEdit,
  gap,
  children,
}: {
  title: string
  onEdit: () => void
  gap: number
  children: ReactNode
}) {
  return (
    <View style={{ paddingHorizontal: 20, gap }}>
      <View style={{ flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' }}>
        <Text v="h3" accessibilityRole="header">
          {title}
        </Text>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel={`${title} 편집`}
          onPress={onEdit}
          hitSlop={6}
          style={{ width: 44, height: 44, alignItems: 'flex-end', justifyContent: 'center' }}
        >
          <Icon name="edit" size={20} color="t3" />
        </Pressable>
      </View>
      {children}
    </View>
  )
}

/** 마이 › 프로필: the hub profile as others see it, with an edit button per section. */
export function ProfileTab() {
  const c = useColors()
  const { data: p, isLoading } = useMyProfile()
  if (isLoading || !p) return <ActivityIndicator style={{ marginTop: 60 }} />
  const job = JOB_CATEGORIES.find((j) => j.key === p.jobCategory)?.label ?? ''
  const status = CAREER_STATUSES.find((s) => s.key === p.careerStatus)?.label ?? ''

  return (
    <View style={{ gap: 22, paddingTop: 22, paddingBottom: 40 }}>
      <View style={{ alignItems: 'center', gap: 6, paddingHorizontal: 20 }}>
        <Avatar name={p.displayName} url={p.avatarUrl} size={84} />
        <Text v="h1" style={{ marginTop: 6 }}>
          {p.displayName}
        </Text>
        {p.headline ? (
          <Text v="b2" color="t2" style={{ textAlign: 'center' }}>
            {p.headline}
          </Text>
        ) : null}
        <View style={{ flexDirection: 'row', gap: 6, marginTop: 4 }}>
          {job || p.tenureYears != null ? <Badge label={[job, tenureLabel(p.tenureYears)].filter(Boolean).join(' · ')} tone="grey" /> : null}
          {status ? <Badge label={status} tone={p.careerStatus === 'seeking' ? 'ac' : 'grey'} /> : null}
        </View>
        <View style={{ flexDirection: 'row', alignItems: 'center', gap: 4, marginTop: 6 }}>
          <Icon name="people" size={14} color="t3" />
          <Text v="c1" color="t3">
            허브에 이렇게 보여요 · 팔로워 {p.followerCount}
          </Text>
        </View>
        <Button
          label="기본 정보 편집"
          icon="edit"
          variant="secondary"
          size="sm"
          onPress={() => edit('basic')}
          style={{ marginTop: 10 }}
        />
      </View>

      <Section title="소개" onEdit={() => edit('intro')} gap={6}>
        <Text v="b2" color={p.intro ? 't2' : 't3'}>
          {p.intro || '아직 소개가 없어요. 3~4문장으로 나를 소개해 보세요.'}
        </Text>
      </Section>

      <Section title="경력" onEdit={() => edit('career')} gap={12}>
        {p.careers.length === 0 ? (
          <Text v="b2" color="t3">
            아직 등록한 경력이 없어요.
          </Text>
        ) : (
          p.careers.map((cr, i) => {
            const last = i === p.careers.length - 1
            return (
              <View key={`${cr.company}-${i}`} style={{ flexDirection: 'row', gap: 14 }}>
                <View style={{ alignItems: 'center', paddingTop: 6 }}>
                  <View
                    style={{
                      width: 10,
                      height: 10,
                      borderRadius: 5,
                      backgroundColor: cr.endedOn ? c.t4 : c.ac,
                    }}
                  />
                  {!last ? (
                    <View style={{ flex: 1, width: 2, backgroundColor: c.line, marginTop: 4 }} />
                  ) : null}
                </View>
                <View style={{ flex: 1, paddingBottom: last ? 0 : 12 }}>
                  <Text v="b1" weight="700">
                    {cr.company} · {cr.role}
                  </Text>
                  <Text v="c1" color="t3">
                    {careerPeriod(cr)}
                  </Text>
                  {cr.description ? (
                    <Text v="b2" color="t2" style={{ marginTop: 4 }}>
                      {cr.description}
                    </Text>
                  ) : null}
                </View>
              </View>
            )
          })
        )}
      </Section>

      <Section title="기술 스택" onEdit={() => edit('skills')} gap={10}>
        {p.skills.length === 0 ? (
          <Text v="b2" color="t3">
            아직 등록한 기술이 없어요.
          </Text>
        ) : (
          <View style={{ flexDirection: 'row', flexWrap: 'wrap', gap: 6 }}>
            {p.skills.map((s) => (
              <Badge key={s} label={s} tone="grey" />
            ))}
          </View>
        )}
      </Section>
    </View>
  )
}
