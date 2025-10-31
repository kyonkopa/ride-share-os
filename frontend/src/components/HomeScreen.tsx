import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { ClockInForm } from "./ClockInForm"
import { CurrentShift } from "@/features/current-shift"
import { useShift } from "../hooks/useShift"
import { Calendar, Clock, LogOut, Activity } from "lucide-react"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useTodayShifts } from "@/features/today-shifts/useTodayShifts"
import { useTodaysShiftEvents } from "@/features/todays-shift-events/useTodaysShiftEvents"
import { useAuthStore } from "@/stores/AuthStore"
import {
  formatDateTime,
  getShiftDuration,
  parseGraphQLDateTime,
} from "@/utils/dateUtils"
import type { ShiftAssignment } from "@/codegen/graphql"
import { Badge } from "./ui/badge"

interface HomeScreenProps {
  children?: React.ReactNode
}

export function HomeScreen({ children }: HomeScreenProps) {
  const { vehicles } = useVehicles()

  const { currentShift } = useShift()
  const [showClockIn, setShowClockIn] = useState(false)

  const { getTodayShifts, data: todayShiftsData } = useTodayShifts()
  const { getTodaysShiftEvents, data: todaysShiftEventsData } =
    useTodaysShiftEvents()

  const { user } = useAuthStore()

  // Memoized calculations for today's shifts
  const todayShiftsStats = useMemo(() => {
    const shifts = todayShiftsData?.todayShifts || []

    const totalShifts = shifts.length

    const totalHours = shifts.reduce((acc, shift) => {
      const start = parseGraphQLDateTime(shift.actualStartTime)
      // if shift.actualEndTime is null, skip the shift
      if (!shift.actualEndTime) {
        return acc
      }
      const end = parseGraphQLDateTime(shift.actualEndTime)
      const duration = end.diff(start, "hours").hours
      return acc + duration
    }, 0)

    // Calculate earnings from revenueRecords if available
    const totalEarnings = shifts.reduce((acc, shift) => {
      const shiftEarnings =
        shift.revenueRecords?.reduce(
          (sum, record) => sum + record.totalProfit,
          0
        ) || 0
      return acc + shiftEarnings
    }, 0)

    const totalDistance = shifts.reduce((acc, shift) => {
      // Calculate distance from shift events if available
      const clockInEvent = shift.shiftEvents?.find(
        (event) => event.eventType === "clock_in"
      )
      const clockOutEvent = shift.shiftEvents?.find(
        (event) => event.eventType === "clock_out"
      )

      if (clockInEvent?.odometer && clockOutEvent?.odometer) {
        return acc + (clockOutEvent.odometer - clockInEvent.odometer)
      }
      return acc
    }, 0)

    return {
      totalShifts,
      totalHours: totalHours.toFixed(1),
      totalEarnings: totalEarnings.toFixed(2),
      totalDistance,
    }
  }, [todayShiftsData])

  // Get today's shifts and events when the user is a driver
  useEffect(() => {
    if (user?.driver) {
      getTodayShifts()
      getTodaysShiftEvents()
    }
  }, [user?.driver, getTodayShifts, getTodaysShiftEvents])

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

  const onClockIn = () => setShowClockIn(true)

  return (
    <>
      <div className="space-y-6">
        {/* Status Badge */}
        <StatusBadge isOnline={!!currentShift} />

        {/* Current Shift Status */}
        <CurrentShift onClockIn={onClockIn} vehicles={vehicles} />

        {/* Today's Shifts */}
        {todayShiftsStats.totalShifts > 0 && (
          <Card>
            <CardHeader>
              <CardTitle>Today's Shifts</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                {(todayShiftsData?.todayShifts || []).map((shift) => {
                  return (
                    <div
                      key={shift.id}
                      className="flex items-center justify-between p-3 border rounded-lg"
                    >
                      <div className="flex items-center gap-3">
                        <div
                          className={`w-3 h-3 rounded-full ${
                            shift.status === "active"
                              ? "bg-green-500"
                              : shift.status === "completed"
                                ? "bg-blue-500"
                                : "bg-gray-500"
                          }`}
                        />
                        <div>
                          <p className="font-medium">
                            {shift.vehicle?.displayName}
                            {shift.status === "completed" && (
                              <Badge className="bg-green-500 ml-2">
                                Completed
                              </Badge>
                            )}
                          </p>
                          <p className="text-sm text-muted-foreground">
                            {formatDateTime(shift.actualStartTime, "HH:mm")} -{" "}
                            {shift.actualEndTime
                              ? formatDateTime(shift.actualEndTime, "HH:mm")
                              : "Active"}
                          </p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="font-medium">
                          {getShiftDuration(shift.actualStartTime)}
                        </p>
                        {shift.revenueRecords &&
                          shift.revenueRecords.length > 0 && (
                            <p className="text-sm text-green-600">
                              GHS{" "}
                              {shift.revenueRecords
                                .reduce(
                                  (sum, record) => sum + record.totalProfit,
                                  0
                                )
                                .toFixed(2)}
                            </p>
                          )}
                      </div>
                    </div>
                  )
                })}
              </div>
            </CardContent>
          </Card>
        )}

        {/* Today's Activity */}
        {todaysShiftEventsData?.todaysShiftEvents &&
          todaysShiftEventsData.todaysShiftEvents.length > 0 && (
            <Card>
              <CardHeader>
                <CardTitle>Today's Activity</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {todaysShiftEventsData.todaysShiftEvents.map((event) => {
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
                          {event.odometer !== null &&
                            event.odometer !== undefined && (
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
          )}

        {/* Today's Summary */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Calendar className="h-5 w-5" />
              Today's Summary
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 gap-4">
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {todayShiftsStats.totalShifts}
                </p>
                <p className="text-sm text-muted-foreground">Shifts</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-primary">
                  {todayShiftsStats.totalHours}
                </p>
                <p className="text-sm text-muted-foreground">Total Hours</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-green-600">
                  GHS {todayShiftsStats.totalEarnings}
                </p>
                <p className="text-sm text-muted-foreground">Total Earnings</p>
              </div>
              <div className="text-center p-4 bg-muted rounded-lg">
                <p className="text-2xl font-bold text-blue-600">
                  {todayShiftsStats.totalDistance} km
                </p>
                <p className="text-sm text-muted-foreground">Distance</p>
              </div>
            </div>
          </CardContent>
        </Card>

        {children}
      </div>

      {/* Clock In Modal */}
      <ClockInForm
        vehicles={vehicles}
        onClockInSuccess={() => {
          setShowClockIn(false)
        }}
        open={showClockIn}
        onOpenChange={setShowClockIn}
        todayShifts={(todayShiftsData?.todayShifts || []) as ShiftAssignment[]}
      />
    </>
  )
}
