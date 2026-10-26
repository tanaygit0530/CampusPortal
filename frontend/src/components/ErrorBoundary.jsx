import React from 'react'

export default class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false, error: null }
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error }
  }

  componentDidCatch(error, errorInfo) {
    console.error('[ErrorBoundary caught error]:', error, errorInfo)
  }

  handleReload = () => {
    window.location.reload()
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="flex min-h-[400px] flex-col items-center justify-center p-8 text-center">
          <div className="rounded-3xl border border-rust/30 bg-rust/5 p-8 max-w-lg shadow-sm">
            <span className="font-mono text-xs uppercase tracking-widest text-rust font-semibold">
              Application Error
            </span>
            <h2 className="mt-2 font-display text-2xl font-semibold text-ink">
              Something went wrong
            </h2>
            <p className="mt-2 text-sm text-slate leading-relaxed">
              An unexpected error occurred while rendering this view. Don't worry, your data in
              MongoDB is safe.
            </p>
            {this.state.error?.message && (
              <pre className="mt-4 rounded-xl bg-ink/5 p-3 font-mono text-xs text-rust text-left overflow-x-auto">
                {this.state.error.message}
              </pre>
            )}
            <div className="mt-6 flex justify-center gap-3">
              <button
                onClick={this.handleReload}
                className="rounded-full bg-ink px-6 py-2.5 font-body text-xs font-semibold text-paper hover:bg-ink-light cursor-pointer"
              >
                Reload Page
              </button>
            </div>
          </div>
        </div>
      )
    }

    return this.props.children
  }
}
