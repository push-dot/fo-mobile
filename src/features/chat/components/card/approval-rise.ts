/** Time the approval panel takes to slide up. */
export const RISE_MS = 420
/** Extra time before the end state is forced; the panel is open by RISE_MS + RISE_SLACK_MS whatever the native animation reports. */
export const RISE_SLACK_MS = 300

/**
 * Plays the rise and sets its end value after RISE_MS + RISE_SLACK_MS: the native animation can go missing (a card that mounts
 * while the keyboard comes down, reduce motion), and then the panel would stay invisible with an empty accessibility tree.
 * Runs from the mount effect, never from onLayout, which does not fire for a panel that is still at opacity 0.
 * The rise runs on the JS driver (a native-driven value detached from the view when the style graph changed mid-flight, leaving opacity 0).
 * onLand lets the panel switch to an explicit static style: the animated value can detach from the view when the style graph changes
 * mid-flight (reduce motion arrives after mount), and then even setValue(1) does not reach the view.
 * Returns the cleanup that cancels the timer.
 */
export const riseOnMount = (
  rise: { setValue: (v: number) => void },
  play: () => void,
  onLand: () => void,
): (() => void) => {
  play()
  const timer = setTimeout(() => {
    rise.setValue(1)
    onLand()
  }, RISE_MS + RISE_SLACK_MS)
  return () => clearTimeout(timer)
}
