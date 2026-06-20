import { Component } from 'react'

// Catches render-time errors. The common one in a lazy-loaded PWA is a
// chunk-load failure: a fresh install navigates to a route whose JS chunk
// isn't cached yet, or a new deploy changed the chunk hashes. Without this,
// the failed dynamic import throws and React unmounts the whole tree → white
// screen. Here we reload once to fetch the current chunks (rate-limited so a
// genuinely broken build can't loop forever).
const CHUNK_ERROR = /Loading chunk|loading dynamically imported module|Importing a module script failed|Failed to fetch dynamically imported module/i

export class ErrorBoundary extends Component {
  constructor(props) {
    super(props)
    this.state = { hasError: false }
  }

  static getDerivedStateFromError() {
    return { hasError: true }
  }

  componentDidCatch(error) {
    if (CHUNK_ERROR.test(error?.message || '')) {
      const last = Number(sessionStorage.getItem('chunk-reload-ts') || 0)
      if (Date.now() - last > 10000) {
        sessionStorage.setItem('chunk-reload-ts', String(Date.now()))
        window.location.reload()
      }
    }
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 px-6 text-center gap-4">
          <img src="/logo.svg" alt="FitTogether" className="w-12 h-12 opacity-80" />
          <p className="text-gray-700 font-medium">Something went wrong loading the app.</p>
          <button
            onClick={() => window.location.reload()}
            className="px-5 py-2.5 rounded-xl bg-brand-600 text-white font-medium active:scale-95 transition-transform"
          >
            Reload
          </button>
        </div>
      )
    }
    return this.props.children
  }
}
