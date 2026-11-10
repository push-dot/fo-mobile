import { requireNativeModule } from 'expo'

const SegmentedAppearance = requireNativeModule<{
  setTitleFont: (name: string, size: number, light: string, dark: string) => void
}>('SegmentedAppearance')

/** `light` and `dark` are the unselected title colour (token t3) for each theme. */
export const setSegmentedTitleFont = (name: string, size: number, light: string, dark: string) =>
  SegmentedAppearance.setTitleFont(name, size, light, dark)
