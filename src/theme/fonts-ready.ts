/** expo-font leaves `loaded` false when `error` is set. Waiting on `loaded` alone never paints. */
export const designFontsReady = (loaded: boolean, error: Error | null): boolean => loaded || error != null
