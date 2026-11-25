import { Platform } from 'react-native'
import { platformTokens } from './platform'

export const platformTheme = platformTokens(Platform.OS === 'ios' ? 'ios' : 'android')
