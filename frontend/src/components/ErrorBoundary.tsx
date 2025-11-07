import { useEffect, useMemo } from "react"
import { useRouteError, isRouteErrorResponse } from "react-router"
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

interface ErrorCardProps {
  title: string
  description: string
  errorDetails?: string
  errorStack?: string | null
  actions: React.ReactNode
}

function ErrorCard({
  title,
  description,
  errorDetails,
  errorStack,
  actions,
}: ErrorCardProps) {
  const showDevDetails = import.meta.env.DEV && errorDetails

  return (
    <div className="min-h-screen flex items-center justify-center p-4 bg-background">
      <Card className="w-full max-w-2xl">
        <CardHeader>
          <div className="flex items-center gap-3">
            <AlertTriangle className="h-6 w-6 text-destructive" />
            <CardTitle className="text-2xl">{title}</CardTitle>
          </div>
          <CardDescription>{description}</CardDescription>
        </CardHeader>
        {showDevDetails && (
          <CardContent>
            <div className="mt-4 p-4 bg-muted rounded-lg">
              <p className="text-sm font-mono text-destructive mb-2">
                {errorDetails}
              </p>
              {errorStack && (
                <details className="mt-2">
                  <summary className="text-sm cursor-pointer text-muted-foreground hover:text-foreground">
                    Stack trace
                  </summary>
                  <pre className="mt-2 text-xs overflow-auto max-h-64 p-2 bg-background rounded border">
                    {errorStack}
                  </pre>
                </details>
              )}
            </div>
          </CardContent>
        )}
        <CardFooter className="flex gap-2 flex-wrap">{actions}</CardFooter>
      </Card>
    </div>
  )
}

// Shared action handlers
const handleReload = () => window.location.reload()
const handleGoHome = () => (window.location.href = "/")
const handleClearCacheAndReload = async () => {
  await clearCacheAndReload()
}

// Shared action button components
const ReloadButton = () => (
  <Button onClick={handleReload} variant="default">
    <RefreshCw className="h-4 w-4" />
    Reload Page
  </Button>
)

const HomeButton = () => (
  <Button onClick={handleGoHome} variant="outline">
    <Home className="h-4 w-4" />
    Go Home
  </Button>
)

const ClearCacheButton = () => (
  <Button onClick={handleClearCacheAndReload} variant="default">
    <RefreshCw className="h-4 w-4 mr-2" />
    Clear Cache & Reload
  </Button>
)

interface ErrorDisplayProps {
  errorDetails?: string
  errorStack?: string | null
}

function CacheErrorDisplay({ errorDetails, errorStack }: ErrorDisplayProps) {
  return (
    <ErrorCard
      title="Update Available"
      description="A new version of the app is available. Clearing cache and reloading..."
      errorDetails={errorDetails}
      errorStack={errorStack}
      actions={<ClearCacheButton />}
    />
  )
}

function ServerErrorDisplay({ errorDetails, errorStack }: ErrorDisplayProps) {
  return (
    <ErrorCard
      title="Server Error (500)"
      description="We encountered an error while processing your request. Please try again."
      errorDetails={errorDetails}
      errorStack={errorStack}
      actions={
        <>
          <ReloadButton />
          <HomeButton />
        </>
      }
    />
  )
}

interface RoutingErrorDisplayProps extends ErrorDisplayProps {
  status: number
  errorMessage: string
}

function RoutingErrorDisplay({
  status,
  errorMessage,
  errorDetails,
  errorStack,
}: RoutingErrorDisplayProps) {
  return (
    <ErrorCard
      title={`Error ${status}`}
      description={errorMessage}
      errorDetails={errorDetails}
      errorStack={errorStack}
      actions={
        <>
          <ReloadButton />
          <HomeButton />
        </>
      }
    />
  )
}

function GenericErrorDisplay({ errorDetails, errorStack }: ErrorDisplayProps) {
  return (
    <ErrorCard
      title="Something went wrong"
      description="An unexpected error occurred. We're sorry for the inconvenience."
      errorDetails={errorDetails}
      errorStack={errorStack}
      actions={
        <>
          <ReloadButton />
          <HomeButton />
        </>
      }
    />
  )
}

function ErrorBoundary() {
  const error = useRouteError()

  // Memoize error analysis to avoid recalculating
  const errorInfo = useMemo(() => {
    const isRouteError = isRouteErrorResponse(error)
    const status = isRouteError ? error.status : null
    const isServerError = isRouteError && status === 500
    const isCacheError = error instanceof Error && isCacheMismatchError(error)

    const errorMessage = isRouteError
      ? error.statusText || `Error ${error.status}`
      : error instanceof Error
        ? error.message
        : "An unexpected error occurred"

    const errorDetails =
      error instanceof Error ? error.toString() : String(error)
    const errorStack = error instanceof Error ? error.stack : null

    return {
      isRouteError,
      status,
      isServerError,
      isCacheError,
      errorMessage,
      errorDetails,
      errorStack,
    }
  }, [error])

  useEffect(() => {
    console.error("ErrorBoundary caught an error:", error)

    if (errorInfo.isCacheError) {
      console.log(
        "[ErrorBoundary] Cache mismatch detected, clearing cache and reloading..."
      )
      clearCacheAndReload()
      return
    }

    // You can also log to an error reporting service here
    // e.g., Sentry, LogRocket, etc.
  }, [error, errorInfo.isCacheError])

  const {
    errorDetails,
    errorStack,
    isCacheError,
    isServerError,
    isRouteError,
    status,
    errorMessage,
  } = errorInfo

  if (isCacheError) {
    return (
      <CacheErrorDisplay errorDetails={errorDetails} errorStack={errorStack} />
    )
  }

  if (isServerError) {
    return (
      <ServerErrorDisplay errorDetails={errorDetails} errorStack={errorStack} />
    )
  }

  if (isRouteError && status !== null) {
    return (
      <RoutingErrorDisplay
        status={status}
        errorMessage={errorMessage}
        errorDetails={errorDetails}
        errorStack={errorStack}
      />
    )
  }

  return (
    <GenericErrorDisplay errorDetails={errorDetails} errorStack={errorStack} />
  )
}

export default ErrorBoundary
