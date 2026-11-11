import * as SplashScreen from 'expo-splash-screen'
import { Component, type ErrorInfo, type ReactNode, useEffect } from 'react'
import { View } from 'react-native'
import { spacing, useColors } from '../../theme'
import Button from './button'
import { reduceError, type ErrorBoundaryUiState } from './reduce-error'
import Text from './text'

const ErrorFallbackView = ({ onRetry }: { onRetry: () => void }) => {
  const c = useColors()

  useEffect(() => {
    void SplashScreen.hideAsync().catch(() => undefined)
  }, [])

  return (
    <View
      style={{
        flex: 1,
        justifyContent: 'center',
        alignItems: 'center',
        gap: spacing[4],
        paddingHorizontal: spacing[5],
        backgroundColor: c.bg,
      }}
    >
      <Text v="h2" style={{ textAlign: 'center' }}>
        화면을 불러오지 못했어요
      </Text>
      <Button label="다시 시도" onPress={onRetry} />
    </View>
  )
}

type State = { ui: ErrorBoundaryUiState }

type Props = { children: ReactNode }

export class RootErrorBoundary extends Component<Props, State> {
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
