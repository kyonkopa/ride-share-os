import { Component } from "react"
import type { ErrorInfo, ReactNode } from "react"
import { AlertTriangle, RefreshCw, Home } from "lucide-react"
import { Button } from "./ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { isCacheMismatchError, clearCacheAndReload } from "../lib/serviceWorker"

interface Props {
  children: ReactNode
}

interface State {
  hasError: boolean
  error: Error | null
  errorInfo: ErrorInfo | null
}

class ErrorBoundary extends Component<Props, State> {
  constructor(props: Props) {
    super(props)
    this.state = {
      hasError: false,
      error: null,
      errorInfo: null,
    }
  }

  static getDerivedStateFromError(error: Error): State {
    return {
      hasError: true,
      error,
      errorInfo: null,
    }
  }

  componentDidCatch(error: Error, errorInfo: ErrorInfo) {
    // Log error to console for debugging
    console.error("ErrorBoundary caught an error:", error, errorInfo)

    this.setState({
      error,
      errorInfo,
    })

    // Check if this is a cache-related error and auto-fix it
    if (isCacheMismatchError(error)) {
      console.log(
        "[ErrorBoundary] Cache mismatch detected, clearing cache and reloading..."
      )
      // Automatically clear cache and reload for cache-related errors
      clearCacheAndReload()
      return
    }

    // You can also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }

  handleReset = () => {
    this.setState({
      hasError: false,
      error: null,
      errorInfo: null,
    })
  }

  handleReload = () => {
    window.location.reload()
  }

  handleGoHome = () => {
    window.location.href = "/"
  }

  handleClearCacheAndReload = async () => {
    await clearCacheAndReload()
  }

  render() {
    if (this.state.hasError) {
      const isServerError =
        this.state.error?.message?.includes("500") ||
        this.state.error?.message?.toLowerCase().includes("server error") ||
        this.state.error?.stack?.includes("500")

      const isCacheError = this.state.error
        ? isCacheMismatchError(this.state.error)
        : false

      return (
        <div className="min-h-screen flex items-center justify-center p-4 bg-background">
          <Card className="w-full max-w-2xl">
            <CardHeader>
              <div className="flex items-center gap-3">
                <AlertTriangle className="h-6 w-6 text-destructive" />
                <CardTitle className="text-2xl">
                  {isCacheError
                    ? "Update Available"
                    : isServerError
                      ? "Server Error (500)"
                      : "Something went wrong"}
                </CardTitle>
              </div>
              <CardDescription>
                {isCacheError
                  ? "A new version of the app is available. Clearing cache and reloading..."
                  : isServerError
                    ? "We encountered an error while processing your request. Please try again."
                    : "An unexpected error occurred. We're sorry for the inconvenience."}
              </CardDescription>
            </CardHeader>
            <CardContent>
              {import.meta.env.DEV && this.state.error && (
                <div className="mt-4 p-4 bg-muted rounded-lg">
                  <p className="text-sm font-mono text-destructive mb-2">
                    {this.state.error.toString()}
                  </p>
                  {this.state.errorInfo && (
                    <details className="mt-2">
                      <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                        Stack trace
                      </summary>
                      <pre className="mt-2 text-xs overflow-auto max-h-64 p-2 bg-background rounded border">
                        {this.state.errorInfo.componentStack}
                      </pre>
                    </details>
                  )}
                </div>
              )}
            </CardContent>
            <CardFooter className="flex gap-2 flex-wrap">
              {isCacheError ? (
                <Button
                  onClick={this.handleClearCacheAndReload}
                  variant="default"
                >
                  <RefreshCw className="h-4 w-4 mr-2" />
                  Clear Cache & Reload
                </Button>
              ) : (
                <>
                  <Button onClick={this.handleReload} variant="default">
                    <RefreshCw className="h-4 w-4" />
                    Reload Page
                  </Button>
                  <Button onClick={this.handleGoHome} variant="outline">
                    <Home className="h-4 w-4" />
                    Go Home
                  </Button>
                </>
              )}
              {import.meta.env.DEV && !isCacheError && (
                <Button onClick={this.handleReset} variant="ghost">
                  Try Again
                </Button>
              )}
            </CardFooter>
          </Card>
        </div>
      )
    }

    return this.props.children
  }
}

export default ErrorBoundary
