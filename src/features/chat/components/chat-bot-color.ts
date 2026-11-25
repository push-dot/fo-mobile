import { createContext } from 'react'
import type { MascotColor } from '../../../theme/mascot'

export const ChatBotColor = createContext<MascotColor>('push')
