import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog"
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert"
import { useShift } from "@/hooks/useShift"
import {
  Clock,
  Play,
  Square,
  Pause,
  PlayCircle,
  AlertTriangle,
} from "lucide-react"
import { useState } from "react"
import { ClockOutForm } from "@/components/ClockOutForm"
import { getShiftDuration, parseGraphQLDateTime } from "@/utils/dateUtils"
import { DateTime } from "luxon"
import type { VehicleFragmentFragment } from "@/codegen/graphql"
import { ShiftStatusEnum } from "@/codegen/graphql"
import { usePauseShift } from "@/features/shift-pause/usePauseShift"
import { useResumeShift } from "@/features/shift-pause/useResumeShift"
import { useNotification } from "@/hooks/useNotification"

interface CurrentShiftProps {
  onClockIn?: () => void
  vehicles: VehicleFragmentFragment[]
}

export function CurrentShift({ onClockIn, vehicles }: CurrentShiftProps) {
  const { currentShift, clockInShiftEvent } = useShift()
  const [showClockOut, setShowClockOut] = useState(false)
  const [showConfirmDialog, setShowConfirmDialog] = useState(false)
  const [showPauseConfirmDialog, setShowPauseConfirmDialog] = useState(false)
  const { addSuccess, addError } = useNotification()

  const { handlePauseShift, loading: pauseLoading } = usePauseShift({
    onSuccess: () => {
      addSuccess("Shift paused successfully")
    },
    onError: (errors) => {
      addError(errors[0]?.message || "Failed to pause shift")
    },
  })

  const { handleResumeShift, loading: resumeLoading } = useResumeShift({
    onSuccess: () => {
      addSuccess("Shift resumed successfully")
    },
    onError: (errors) => {
      addError(errors[0]?.message || "Failed to resume shift")
    },
  })

  const onClockOutClick = () => setShowConfirmDialog(true)
  const onConfirmClockOut = () => {
    setShowConfirmDialog(false)
    setShowClockOut(true)
  }

  const onPauseClick = () => setShowPauseConfirmDialog(true)
  const onConfirmPause = () => {
    setShowPauseConfirmDialog(false)
    handlePauseShift()
  }
  const currentVehicle = currentShift
    ? vehicles?.find((v) => v.id === currentShift.vehicle?.id)
    : null

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  const isPaused = currentShift?.status === ShiftStatusEnum.Paused
  const isActive = currentShift?.status === ShiftStatusEnum.Active

  // Calculate shift duration in hours to check if it exceeds 12 hours
  const getShiftDurationInHours = (startTime: string): number => {
    const start = parseGraphQLDateTime(startTime)
    const end = DateTime.now()
    const diff = end.diff(start, "hours")
    return diff.hours
  }

  const shiftDurationHours = clockInShiftEvent
    ? getShiftDurationInHours(clockInShiftEvent.createdAt)
    : 0
  const isShiftOver12Hours = shiftDurationHours > 12

  // Inline component for extended shift duration alert
  const ExtendedShiftDurationAlert = () => {
    if (!isShiftOver12Hours) return null

    return (
      <Alert className="border-amber-300 bg-amber-50">
        <AlertTriangle className="h-4 w-4 text-amber-600" />
        <AlertTitle className="text-amber-800">
          Extended Shift Duration
        </AlertTitle>
        <AlertDescription className="text-amber-700">
          Your shift has exceeded 12 hours. Please consider clocking out to
          rest.
        </AlertDescription>
      </Alert>
    )
  }

  if (currentShift && clockInShiftEvent) {
    // Paused shift state
    if (isPaused) {
      return (
        <Card className="border-amber-200 bg-amber-50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2 text-amber-800">
              <Pause className="h-5 w-5" />
              Paused Shift
            </CardTitle>
            <CardDescription className="text-amber-700">
              Your shift is currently paused
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <ExtendedShiftDurationAlert />
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Vehicle</p>
                <p className="font-semibold">
                  {currentVehicle?.make} {currentVehicle?.model}
                </p>
                <p className="text-sm text-muted-foreground">
                  {currentVehicle?.licensePlate}
                </p>
              </div>
              <div>
                <p className="text-sm text-muted-foreground">Started</p>
                <p className="font-semibold">
                  {formatTime(clockInShiftEvent.createdAt)}
                </p>
                <p className="text-sm text-muted-foreground">
                  Duration: {getShiftDuration(clockInShiftEvent.createdAt)}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-muted-foreground">Start Odometer</p>
                <p className="font-semibold">{clockInShiftEvent.odometer} km</p>
              </div>
            </div>

            <Button
              onClick={handleResumeShift}
              className="w-full bg-green-600 hover:bg-green-700"
              size="lg"
              disabled={resumeLoading}
            >
              <PlayCircle className="h-4 w-4 mr-2" />
              {resumeLoading ? "Resuming..." : "Resume Shift"}
            </Button>
          </CardContent>
        </Card>
      )
    }

    // Active shift state
    if (isActive) {
      return (
        <>
          <Card className="border-green-200 bg-green-50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-green-800">
                <Clock className="h-5 w-5" />
                Active Shift
              </CardTitle>
              <CardDescription className="text-green-700">
                You're currently on shift
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              <ExtendedShiftDurationAlert />
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">Vehicle</p>
                  <p className="font-semibold">
                    {currentVehicle?.make} {currentVehicle?.model}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    {currentVehicle?.licensePlate}
                  </p>
                </div>
                <div>
                  <p className="text-sm text-muted-foreground">Started</p>
                  <p className="font-semibold">
                    {formatTime(clockInShiftEvent.createdAt)}
                  </p>
                  <p className="text-sm text-muted-foreground">
                    Duration: {getShiftDuration(clockInShiftEvent.createdAt)}
                  </p>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-muted-foreground">
                    Start Odometer
                  </p>
                  <p className="font-semibold">
                    {clockInShiftEvent.odometer} km
                  </p>
                </div>
              </div>

              <div className="flex gap-2">
                <Button
                  onClick={onPauseClick}
                  className="flex-1 bg-amber-600 hover:bg-amber-700"
                  size="lg"
                  disabled={pauseLoading}
                >
                  <Pause className="h-4 w-4 mr-2" />
                  Pause
                </Button>
                <Button
                  onClick={onClockOutClick}
                  className="flex-1 bg-red-600 hover:bg-red-700"
                  size="lg"
                >
                  <Square className="h-4 w-4 mr-2" />
                  Clock Out
                </Button>
              </div>
            </CardContent>
          </Card>

          <AlertDialog
            open={showConfirmDialog}
            onOpenChange={setShowConfirmDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Clock Out</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to clock out? You'll need to fill in
                  your final odometer reading, range, and other shift details.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmClockOut}
                  className="bg-red-600 hover:bg-red-700"
                >
                  Confirm
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <AlertDialog
            open={showPauseConfirmDialog}
            onOpenChange={setShowPauseConfirmDialog}
          >
            <AlertDialogContent>
              <AlertDialogHeader>
                <AlertDialogTitle>Confirm Pause Shift</AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to pause your shift? You can resume it
                  later to continue working.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel>Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={onConfirmPause}
                  className="bg-amber-600 hover:bg-amber-700"
                  disabled={pauseLoading}
                >
                  {pauseLoading ? "Pausing..." : "Confirm"}
                </AlertDialogAction>
              </AlertDialogFooter>
            </AlertDialogContent>
          </AlertDialog>

          <ClockOutForm
            clockInShiftEvent={clockInShiftEvent}
            currentShift={currentShift}
            open={showClockOut}
            onOpenChange={setShowClockOut}
          />
        </>
      )
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <Play className="h-5 w-5" />
          Ready to Start
        </CardTitle>
        <CardDescription>You're not currently on shift</CardDescription>
      </CardHeader>
      <CardContent>
        <Button onClick={onClockIn} className="w-full" size="lg">
          <Play className="h-4 w-4 mr-2" />
          Clock In
        </Button>
      </CardContent>
    </Card>
  )
}
