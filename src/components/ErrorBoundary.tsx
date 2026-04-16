import { Component } from 'react'
import type { ReactNode, ErrorInfo } from 'react'

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
}

export class ErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false }

  static getDerivedStateFromError(): State {
    return { hasError: true }
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('App crashed:', error, info.componentStack)
  }

  handleReset = () => {
    try {
      localStorage.removeItem('people-filter-search')
      localStorage.removeItem('people-filter-self')
    } catch {
      // localStorage may be unavailable
    }
    this.setState({ hasError: false })
  }

  render() {
    if (this.state.hasError) {
      return (
        <div style={{
          minHeight: '100vh',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '2rem',
          color: '#f8fafc',
          fontFamily: 'sans-serif',
        }}>
          <div style={{ textAlign: 'center', maxWidth: '400px' }}>
            <p style={{ fontSize: '1.125rem', marginBottom: '1rem' }}>
              表示エラーが発生しました
            </p>
            <p style={{ fontSize: '0.875rem', color: '#94a3b8', marginBottom: '1.5rem' }}>
              保存データをリセットすると復旧できます。設定した条件は初期値に戻ります。
            </p>
            <button
              onClick={this.handleReset}
              style={{
                padding: '0.625rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                background: '#06b6d4',
                color: '#0f172a',
                fontWeight: 600,
                fontSize: '0.875rem',
                cursor: 'pointer',
              }}
            >
              データをリセットして再表示
            </button>
          </div>
        </div>
      )
    }
    return this.props.children
  }
}
