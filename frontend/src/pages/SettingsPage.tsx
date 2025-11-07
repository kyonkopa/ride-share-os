import { useState } from "react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "@/components/ui/spinner"
import { RefreshCw, CheckCircle2, AlertCircle } from "lucide-react"
import { checkForServiceWorkerUpdate, forceUpdate } from "@/lib/serviceWorker"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"

export default function SettingsPage() {
  const [isChecking, setIsChecking] = useState(false)
  const [updateStatus, setUpdateStatus] = useState<{
    message: string
    hasUpdate: boolean
  } | null>(null)

  const handleCheckForUpdates = async () => {
    setIsChecking(true)
    setUpdateStatus(null)

    try {
      const result = await checkForServiceWorkerUpdate()
      setUpdateStatus(result)

      // If update is available, automatically force the update
      if (result.hasUpdate) {
        // Small delay to show the message
        setTimeout(() => {
          forceUpdate()
        }, 1000)
      }
    } catch {
      setUpdateStatus({
        hasUpdate: false,
        message: "An error occurred while checking for updates",
      })
    } finally {
      setIsChecking(false)
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Settings</h1>
        <p className="text-sm text-muted-foreground">
          Manage your application settings and preferences
        </p>
      </div>

      {/* Check for Updates Card */}
      <Card>
        <CardHeader>
          <CardTitle>Application Updates</CardTitle>
          <CardDescription>
            Check for and install the latest version of the application
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <Button
            onClick={handleCheckForUpdates}
            disabled={isChecking}
            className="w-full sm:w-auto"
          >
            {isChecking ? (
              <>
                <Spinner className="mr-2 h-4 w-4" />
                Checking for updates...
              </>
            ) : (
              <>
                <RefreshCw className="mr-2 h-4 w-4" />
                Check for Updates
              </>
            )}
          </Button>

          {updateStatus && (
            <Alert
              className={
                updateStatus.hasUpdate
                  ? "border-green-500 bg-green-50 dark:bg-green-950 dark:border-green-800"
                  : "border-blue-500 bg-blue-50 dark:bg-blue-950 dark:border-blue-800"
              }
            >
              {updateStatus.hasUpdate ? (
                <CheckCircle2 className="h-4 w-4 text-green-600 dark:text-green-400" />
              ) : (
                <AlertCircle className="h-4 w-4 text-blue-600 dark:text-blue-400" />
              )}
              <AlertTitle
                className={
                  updateStatus.hasUpdate
                    ? "text-green-900 dark:text-green-100"
                    : "text-blue-900 dark:text-blue-100"
                }
              >
                {updateStatus.hasUpdate ? "Update Available" : "Up to Date"}
              </AlertTitle>
              <AlertDescription
                className={
                  updateStatus.hasUpdate
                    ? "text-green-800 dark:text-green-200"
                    : "text-blue-800 dark:text-blue-200"
                }
              >
                {updateStatus.message}
              </AlertDescription>
            </Alert>
          )}

          <p className="text-sm text-muted-foreground">
            The application will automatically check for updates periodically.
            You can also manually check for updates using the button above.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}
