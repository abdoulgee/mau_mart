import { Component } from 'react'
import { AlertTriangle, Home, RefreshCw } from 'lucide-react'

// Code-split chunks fail to load after a redeploy or when Vite re-optimizes dependencies
const CHUNK_ERROR = /Failed to fetch dynamically imported module|Importing a module script failed|error loading dynamically imported module|Outdated Optimize Dep/i
const RELOAD_FLAG = 'chunk-reload-at'

/** Shows a recoverable error screen instead of a blank page when rendering crashes. */
export default class ErrorBoundary extends Component {
    state = { error: null }

    static getDerivedStateFromError(error) {
        return { error }
    }

    componentDidUpdate(prevProps) {
        if (this.state.error && prevProps.resetKey !== this.props.resetKey) {
            this.setState({ error: null })
        }
    }

    componentDidCatch(error, info) {
        console.error('Render error:', error, info?.componentStack)

        // Stale code: reload once to fetch the current files (guarded so it can't loop)
        if (CHUNK_ERROR.test(String(error?.message))) {
            const last = Number(sessionStorage.getItem(RELOAD_FLAG) || 0)
            if (Date.now() - last > 10000) {
                sessionStorage.setItem(RELOAD_FLAG, String(Date.now()))
                window.location.reload()
            }
        }
    }

    render() {
        const { error } = this.state
        if (!error) return this.props.children

        const stale = CHUNK_ERROR.test(String(error?.message))
        return (
            <main className="flex min-h-screen items-center justify-center p-6">
                <div className="w-full max-w-md text-center">
                    <div className="mx-auto mb-4 flex h-12 w-12 items-center justify-center rounded-full bg-danger-soft text-danger">
                        <AlertTriangle size={22} aria-hidden />
                    </div>
                    <h1 className="text-lg font-semibold text-fg">
                        {stale ? 'A new version is available' : 'Something went wrong'}
                    </h1>
                    <p className="mt-1 text-sm text-fg-muted">
                        {stale ? 'Reload the page to get the latest version.' : 'This page hit an unexpected error. Reloading usually fixes it.'}
                    </p>
                    {import.meta.env.DEV && !stale && (
                        <pre className="mt-4 max-h-40 overflow-auto rounded-lg border border-line bg-surface-muted p-3 text-left text-xs text-fg-muted">
                            {String(error?.stack || error)}
                        </pre>
                    )}
                    <div className="mt-6 flex justify-center gap-2">
                        <button
                            type="button"
                            onClick={() => window.location.reload()}
                            className="inline-flex h-10 items-center gap-2 rounded-lg bg-brand px-4 text-sm font-medium text-brand-fg hover:bg-brand-hover"
                        >
                            <RefreshCw size={16} aria-hidden />Reload
                        </button>
                        <a href="/" className="inline-flex h-10 items-center gap-2 rounded-lg border border-line bg-surface px-4 text-sm font-medium text-fg hover:bg-surface-hover">
                            <Home size={16} aria-hidden />Home
                        </a>
                    </div>
                </div>
            </main>
        )
    }
}
