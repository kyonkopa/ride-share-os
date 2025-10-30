import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { ClockInForm } from "./ClockInForm"
import { CurrentShift } from "@/features/current-shift"
import { useShift } from "../hooks/useShift"
import { Calendar } from "lucide-react"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useTodayShifts } from "@/features/today-shifts/useTodayShifts"
import { useAuthStore } from "@/stores/AuthStore"
import {
  formatDateTime,
  getShiftDuration,
  parseGraphQLDateTime,
} from "@/utils/dateUtils"
import type { ShiftAssignment } from "@/codegen/graphql"

interface HomeScreenProps {
  children?: React.ReactNode
}

export function HomeScreen({ children }: HomeScreenProps) {
  const { data: vehiclesData } = useVehicles()
  const vehicles = useMemo(() => vehiclesData?.vehicles || [], [vehiclesData])

  const { currentShift } = useShift()
  const [showClockIn, setShowClockIn] = useState(false)

  const { getTodayShifts, data: todayShiftsData } = useTodayShifts()

  const { user } = useAuthStore()

  // Memoized calculations for today's shifts
  const todayShiftsStats = useMemo(() => {
    const shifts = todayShiftsData?.todayShifts || []

    const totalShifts = shifts.length

    const totalHours = shifts.reduce((acc, shift) => {
      const start = parseGraphQLDateTime(shift.actualStartTime)
      const end = parseGraphQLDateTime(shift.actualEndTime)
      const duration = end.diff(start, "hours").hours
      return acc + duration
    }, 0)

    const totalEarnings = shifts.reduce((acc, shift) => {
      // Calculate earnings from revenueRecords if available
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

  // Get today's shifts when the user is a driver
  useEffect(() => {
    if (user?.driver) {
      console.log("calling getTodayShifts")

      getTodayShifts()
    }
  }, [user?.driver, getTodayShifts])

  const onClockIn = () => setShowClockIn(true)

  return (
    <>
      <div className="space-y-6">
        {/* Status Badge */}
        <StatusBadge isOnline={!!currentShift} />

        {/* Current Shift Status */}
        <CurrentShift onClockIn={onClockIn} />

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
