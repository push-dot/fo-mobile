import { LogBox } from 'react-native'

// Dev-only toast. Import this first: require cycles warn while the other imports load.
// These two warnings are known and non-fatal; other warnings still show.
LogBox.ignoreLogs(['Require cycle', '(ADVICE) View'])
