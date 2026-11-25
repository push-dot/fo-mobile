import { View } from 'react-native'
import { WebView } from 'react-native-webview'
import { StyleSheet } from 'react-native-unistyles'
import { WEB_BASE_URL } from '../infrastructure'
import { loadsInWebView, originOf } from './detail-url'

const WARM_PATH = '/__warm'

const ignore = () => undefined

const WarmWebView = () => (
  <View pointerEvents="none" style={styles.box} accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
    <WebView
      source={{ uri: `${WEB_BASE_URL}${WARM_PATH}` }}
      onMessage={ignore}
      onShouldStartLoadWithRequest={({ url }) => loadsInWebView(url, WEB_BASE_URL)}
      originWhitelist={[`${originOf(WEB_BASE_URL)}*`]}
      setSupportMultipleWindows={false}
    />
  </View>
)

const styles = StyleSheet.create(() => ({
  box: { position: 'absolute', width: 1, height: 1, opacity: 0, overflow: 'hidden' },
}))

export default WarmWebView
