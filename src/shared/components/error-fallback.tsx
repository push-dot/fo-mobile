import * as SplashScreen from 'expo-splash-screen'
import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { View } from 'react-native'
import { StyleSheet } from 'react-native-unistyles'
import Button from './button'
import { reduceError, type ErrorBoundaryUiState } from './reduce-error'
import Text from './text'

const ErrorFallbackView = ({ onRetry }: { onRetry: () => void }) => {
  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  return (
    <View
      style={styles.screen}
    >
      <Text v="h2" style={styles.title}>
        화면을 불러오지 못했어요
      </Text>
      <Button label="다시 시도" onPress={onRetry} />
    </View>
  )
}

const styles = StyleSheet.create((theme) => ({
  screen: { flex: 1, justifyContent: 'center', alignItems: 'center', gap: theme.spacing[4], paddingHorizontal: theme.spacing[5], backgroundColor: theme.colors.bg },
  title: { textAlign: 'center' },
}))

type State = { ui: ErrorBoundaryUiState }

type Props = { children: ReactNode }

class RootErrorBoundary extends Component<Props, State> {
  state: State = { ui: 'ok' }

  static getDerivedStateFromError(): State {
    return { ui: reduceError('ok', 'error') }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error(error, info.componentStack)
  }

  private retry = () => {
    this.setState({ ui: reduceError(this.state.ui, 'retry') })
  }

  render() {
    if (this.state.ui === 'error') {
      return <ErrorFallbackView onRetry={this.retry} />
    }
    return this.props.children
  }
}

export default RootErrorBoundary
