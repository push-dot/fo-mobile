import { requireNativeModule } from 'expo'

const SegmentedAppearance = requireNativeModule<{ setTitleFont: (name: string, size: number) => void }>('SegmentedAppearance')

export const setSegmentedTitleFont = (name: string, size: number) => SegmentedAppearance.setTitleFont(name, size)
