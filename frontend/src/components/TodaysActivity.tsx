import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { Clock, LogOut, Activity, Pause, PlayCircle } from "lucide-react"
import { formatDateTime } from "@/utils/dateUtils"
import type { TodaysShiftEventsQueryQuery } from "@/codegen/graphql"

interface TodaysActivityProps {
  events?: TodaysShiftEventsQueryQuery["todaysShiftEvents"]
}

export function TodaysActivity({ events }: TodaysActivityProps) {
  // Get event type display info
  const getEventTypeInfo = (eventType: string) => {
    switch (eventType) {
      case "clock_in":
        return {
          icon: Clock,
          label: "Clock In",
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "clock_out":
        return {
          icon: LogOut,
          label: "Clock Out",
          color: "text-pink-600",
          bgColor: "bg-pink-100",
        }
      case "pause":
        return {
          icon: Pause,
          label: "Pause Shift",
          color: "text-amber-600",
          bgColor: "bg-amber-100",
        }
      case "resume":
        return {
          icon: PlayCircle,
          label: "Resume Shift",
          color: "text-green-600",
          bgColor: "bg-green-100",
        }
      case "telemetry_snapshot":
        return {
          icon: Activity,
          label: "Telemetry",
          color: "text-purple-600",
          bgColor: "bg-purple-100",
        }
      default:
        return {
          icon: Activity,
          label: "Event",
          color: "text-gray-600",
          bgColor: "bg-gray-100",
        }
    }
  }

  if (!events || events.length === 0) {
    return null
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Today's Activity</CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-3">
          {events.map((event) => {
            const eventInfo = getEventTypeInfo(event.eventType)
            const Icon = eventInfo.icon

            return (
              <div
                key={event.id}
                className="flex items-start gap-3 p-3 border rounded-lg hover:bg-muted/50 transition-colors"
              >
                <div
                  className={`p-2 rounded-lg ${eventInfo.bgColor} ${eventInfo.color}`}
                >
                  <Icon className="h-4 w-4" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="flex items-center justify-between gap-2">
                    <p className="font-medium">{eventInfo.label}</p>
                    <p className="text-sm text-muted-foreground">
                      {formatDateTime(event.createdAt, "HH:mm")}
                    </p>
                  </div>
                  {event.shiftAssignment?.vehicle && (
                    <p className="text-sm text-muted-foreground mt-1">
                      {event.shiftAssignment.vehicle.displayName}
                    </p>
                  )}
                  {event.odometer !== null && event.odometer !== undefined && (
                    <p className="text-sm text-muted-foreground">
                      Odometer: {event.odometer.toLocaleString()} km
                    </p>
                  )}
                  {event.vehicleRange !== null &&
                    event.vehicleRange !== undefined && (
                      <p className="text-sm text-muted-foreground">
                        Range: {event.vehicleRange} km
                      </p>
                    )}
                  {event.notes && (
                    <p className="text-sm text-muted-foreground mt-1 italic">
                      {event.notes}
                    </p>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      </CardContent>
    </Card>
  )
}
