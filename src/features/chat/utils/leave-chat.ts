import { router } from 'expo-router'

const HOME = '/(app)/(stack)/(tabs)/(home)' as const

export const leaveChat = () => (router.canGoBack() ? router.back() : router.replace(HOME))
