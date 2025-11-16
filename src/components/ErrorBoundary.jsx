import React from 'react'

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    // Log error to console in development
    if (process.env.NODE_ENV === 'development') {
      console.error('ErrorBoundary caught an error:', error, errorInfo)
    }
  }

  render() {
    if (this.state.hasError) {
      // In production, silently fail and render children
      // This prevents the app from breaking due to non-critical errors
      if (process.env.NODE_ENV === 'production') {
        return this.props.children
      }
      
      // In development, show error details
      return (
        <div className="p-4 bg-red-900/20 border border-red-500/50 rounded-lg m-4">
          <h2 className="text-red-400 font-bold mb-2">Something went wrong</h2>
          <details className="text-red-300 text-sm">
            <summary>Error details</summary>
            <pre className="mt-2 text-xs overflow-auto">
              {this.state.error?.toString()}
            </pre>
          </details>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary

