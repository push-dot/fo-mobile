/** The audit 2026-10 layer of the chat boards overrides the user bubble with a darker grey than `fill`. */
export const userBubbleFill = { light: '#E1E4E8', dark: '#383C43' } as const

/** The file chip inside a user bubble is a veil on the bubble (ChatErrUpload: black at .08, white at .1 in dark), flattened: #E1E4E8 → #CFD2D5, #383C43 → #4C5056. */
export const userBubbleChipFill = { light: '#CFD2D5', dark: '#4C5056' } as const
