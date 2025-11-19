import { useEffect, useState } from "react"
import { useParams, useNavigate, useLocation } from "react-router-dom"
import { useMutation } from "@/hooks/useMutation"
import {
  AcceptScheduledTripMutationDocument,
  DeclineScheduledTripMutationDocument,
  type AcceptScheduledTripMutationMutation,
  type DeclineScheduledTripMutationMutation,
} from "@/codegen/graphql"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Button } from "@/components/ui/button"
import { Spinner } from "@/components/ui/spinner"
import { CheckCircle2, XCircle } from "lucide-react"

type ActionType = "accept" | "decline"

export default function ScheduledTripActionPage() {
  const { token } = useParams<{ token: string }>()
  const location = useLocation()
  const navigate = useNavigate()
  const [status, setStatus] = useState<"loading" | "success" | "error">(
    "loading"
  )
  const [errorMessage, setErrorMessage] = useState<string>("")

  // Determine action from pathname
  const action: ActionType = location.pathname.includes("/accept")
    ? "accept"
    : "decline"

  const { mutate: acceptTrip, loading: acceptLoading } =
    useMutation<AcceptScheduledTripMutationMutation>(
      AcceptScheduledTripMutationDocument,
      {
        onSuccess: () => {
          setStatus("success")
        },
        onError: (errors) => {
          setStatus("error")
          setErrorMessage(errors[0]?.message || "Failed to accept trip")
        },
      }
    )

  const { mutate: declineTrip, loading: declineLoading } =
    useMutation<DeclineScheduledTripMutationMutation>(
      DeclineScheduledTripMutationDocument,
      {
        onSuccess: () => {
          setStatus("success")
        },
        onError: (errors) => {
          setStatus("error")
          setErrorMessage(errors[0]?.message || "Failed to decline trip")
        },
      }
    )

  useEffect(() => {
    if (!token) {
      setStatus("error")
      setErrorMessage("Invalid URL")
      return
    }

    if (action === "accept") {
      acceptTrip({ variables: { token } })
    } else {
      declineTrip({ variables: { token } })
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token, action])

  const isLoading = acceptLoading || declineLoading

  return (
    <div className="flex min-h-screen items-center justify-center bg-background p-4">
      <Card className="w-full max-w-md">
        <CardHeader>
          <CardTitle className="text-center">
            {action === "accept" ? "Accept Trip" : "Decline Trip"}
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {isLoading && status === "loading" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <Spinner className="h-8 w-8" />
              <p className="text-sm text-muted-foreground">
                {action === "accept"
                  ? "Processing your acceptance..."
                  : "Processing your decline..."}
              </p>
            </div>
          )}

          {status === "success" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <CheckCircle2 className="h-16 w-16 text-green-600" />
              <h3 className="text-lg font-semibold">
                Trip {action === "accept" ? "Accepted" : "Declined"}{" "}
                Successfully!
              </h3>
              <p className="text-center text-sm text-muted-foreground">
                {action === "accept"
                  ? "Your trip has been confirmed. We look forward to serving you!"
                  : "Your trip has been declined. If you'd like to schedule another trip, please submit a new request."}
              </p>
              <Button onClick={() => navigate("/")} className="mt-4">
                Go to Home
              </Button>
            </div>
          )}

          {status === "error" && (
            <div className="flex flex-col items-center justify-center space-y-4 py-8">
              <XCircle className="h-16 w-16 text-destructive" />
              <h3 className="text-lg font-semibold">Error</h3>
              <p className="text-center text-sm text-muted-foreground">
                {errorMessage ||
                  "An error occurred while processing your request."}
              </p>
              <div className="flex gap-2">
                <Button variant="outline" onClick={() => navigate("/")}>
                  Go to Home
                </Button>
                <Button
                  onClick={() => {
                    setStatus("loading")
                    if (action === "accept") {
                      acceptTrip({ variables: { token: token! } })
                    } else {
                      declineTrip({ variables: { token: token! } })
                    }
                  }}
                >
                  Try Again
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  )
}
