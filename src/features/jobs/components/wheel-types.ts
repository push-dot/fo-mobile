export const WHEEL_HEIGHT = 150

export type WheelOption = { value: string; label: string }

export type WheelProps = {
  options: WheelOption[]
  value: string
  onChange: (value: string) => void
  /** Accessibility name of this wheel ("시·도", "구"). */
  label: string
}
