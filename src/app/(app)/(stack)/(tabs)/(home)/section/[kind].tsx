import { Redirect, useLocalSearchParams } from 'expo-router'
import type { SectionKind } from '@/features/jobs'
import SectionScreen from '@/screens/jobs/section-screen'

const KINDS: SectionKind[] = ['latest', 'deadline', 'popular']

const Section = () => {
  const { kind } = useLocalSearchParams<{ kind: string }>()
  const k = KINDS.find((x) => x === kind)
  return k ? <SectionScreen kind={k} /> : <Redirect href="/jobs" />
}

export default Section
