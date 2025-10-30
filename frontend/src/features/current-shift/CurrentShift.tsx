import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { useShift } from "@/hooks/useShift"
import { Clock, Play, Square } from "lucide-react"
import { useEffect, useState } from "react"
import { ClockOutForm } from "@/components/ClockOutForm"
import { getShiftDuration } from "@/utils/dateUtils"
import type { VehicleFragmentFragment } from "@/codegen/graphql"

interface CurrentShiftProps {
  onClockIn?: () => void
  vehicles: VehicleFragmentFragment[]
}

export function CurrentShift({ onClockIn, vehicles }: CurrentShiftProps) {
  const { currentShift, clockInShiftEvent } = useShift()
  const [showClockOut, setShowClockOut] = useState(false)

  const onClockOutClick = () => setShowClockOut(true)
  const currentVehicle = currentShift
    ? vehicles?.find((v) => v.id === currentShift.vehicle.id)
    : null

  const formatTime = (timestamp: number) => {
    return new Date(timestamp).toLocaleTimeString([], {
      hour: "2-digit",
      minute: "2-digit",
    })
  }

  useEffect(() => {
    console.log({ currentShift })
  }, [currentShift])

  if (currentShift && clockInShiftEvent) {
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
              <div>
                <p className="text-sm text-muted-foreground">Start Range</p>
                <p className="font-semibold">
                  {clockInShiftEvent.vehicleRange} km
                </p>
              </div>
            </div>

            <Button
              onClick={onClockOutClick}
              className="w-full bg-red-600 hover:bg-red-700"
              size="lg"
            >
              <Square className="h-4 w-4 mr-2" />
              Clock Out
            </Button>
          </CardContent>
        </Card>

        <ClockOutForm
          clockInShiftEvent={clockInShiftEvent}
          currentShift={currentShift}
          open={showClockOut}
          onOpenChange={setShowClockOut}
        />
      </>
    )
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
