import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import { Component, type ReactNode } from 'react'
import './index.css'
import App from './App.tsx'

// Last-resort boundary: any render-time crash shows the error on screen
// instead of unmounting the whole tree into a blank white page.
class ErrorBoundary extends Component<{ children: ReactNode }, { error: Error | null }> {
  state = { error: null as Error | null }

  static getDerivedStateFromError(error: Error) {
    return { error }
  }

  componentDidCatch(error: Error) {
    console.error('Render crashed:', error)
  }

  render() {
    if (this.state.error) {
      return (
        <div className="min-h-screen flex items-center justify-center p-6 bg-gray-50">
          <pre className="font-mono text-sm text-red-700 bg-white border border-red-200 rounded-lg p-6 max-w-2xl whitespace-pre-wrap">
            {`App crashed while rendering:\n\n${this.state.error.message}\n\n${this.state.error.stack}`}\n\n
Reload the page. If this keeps happening, check the browser console (F12).
          </pre>
        </div>
      )
    }
    return this.props.children
  }
}

const root = createRoot(document.getElementById('root')!)
root.render(
  <StrictMode>
    <ErrorBoundary>
      <App />
    </ErrorBoundary>
  </StrictMode>,
)

// Tell the boot watchdog in index.html that we mounted successfully.
;(window as unknown as { __appMounted: boolean }).__appMounted = true
