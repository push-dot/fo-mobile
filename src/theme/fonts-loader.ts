import { useFonts } from 'expo-font'
import { NATIVE_FONTS } from './fonts'
import { designFontsReady } from './fonts-ready'

/** Loads the design-system sans face before the first screen paints. */
export const useDesignFonts = (): boolean => {
  const [ready, error] = useFonts({
    [NATIVE_FONTS['400']]: require('../../assets/fonts/NotoSansKR-Regular.ttf'),
    [NATIVE_FONTS['500']]: require('../../assets/fonts/NotoSansKR-Medium.ttf'),
    [NATIVE_FONTS['600']]: require('../../assets/fonts/NotoSansKR-SemiBold.ttf'),
    [NATIVE_FONTS['700']]: require('../../assets/fonts/NotoSansKR-Bold.ttf'),
    [NATIVE_FONTS['800']]: require('../../assets/fonts/NotoSansKR-ExtraBold.ttf'),
  })
  return designFontsReady(ready, error)
}
