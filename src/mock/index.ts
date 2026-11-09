// Registers every mock route. Each area owns its file.
import { registerMockBrandColors } from '@push/shared/mock-brand'
import './postings'
import './home'
import './hub'
import './me'
import './social'
import './chat'
export { mockFetch } from './server'

// Same board colours as the web mock, so a company keeps one colour across native lists and the WebView detail.
registerMockBrandColors()
