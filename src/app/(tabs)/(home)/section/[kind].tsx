import { Redirect, useLocalSearchParams } from 'expo-router'
import { SectionScreen, type SectionKind } from '../../../../features/jobs/SectionScreen'

const KINDS: SectionKind[] = ['latest', 'deadline', 'popular']

export default function Section() {
  const { kind } = useLocalSearchParams<{ kind: string }>()
  const k = KINDS.find((x) => x === kind)
  return k ? <SectionScreen kind={k} /> : <Redirect href="/jobs" />
}
