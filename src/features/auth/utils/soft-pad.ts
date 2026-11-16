// Whether the phone field raises the system pad when it takes focus. The boards draw the focused field (accent border, caret)
// without the pad, which the OS can only show with it up; the mock link `no-pad` (mock/links.ts) turns it off for the tours.
export const softPad = { shown: true }
