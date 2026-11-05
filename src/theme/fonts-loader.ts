import { useFonts } from 'expo-font'
import { NATIVE_FONTS } from './fonts'

/** Loads the design-system sans face before the first screen paints. */
export const useDesignFonts = (): boolean => {
  const [ready] = useFonts({
    [NATIVE_FONTS['400']]: require('../../assets/fonts/Pretendard-Regular.otf'),
    [NATIVE_FONTS['500']]: require('../../assets/fonts/Pretendard-Medium.otf'),
    [NATIVE_FONTS['600']]: require('../../assets/fonts/Pretendard-SemiBold.otf'),
    [NATIVE_FONTS['700']]: require('../../assets/fonts/Pretendard-Bold.otf'),
    [NATIVE_FONTS['800']]: require('../../assets/fonts/Pretendard-ExtraBold.otf'),
  })
  return ready
}
