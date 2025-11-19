import { useEffect, useMemo, useState } from "react"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { StatusBadge } from "@/components/StatusBadge"
import { ClockInForm } from "./ClockInForm"
import { TodaysShifts } from "./TodaysShifts"
import { TodaysActivity } from "./TodaysActivity"
import { CurrentShift } from "@/features/current-shift"
import { useShift } from "../hooks/useShift"
import { Calendar } from "lucide-react"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useTodayShifts } from "@/features/today-shifts/useTodayShifts"
import { useTodaysShiftEvents } from "@/features/todays-shift-events/useTodaysShiftEvents"
import { useAuthStore } from "@/stores/AuthStore"
import { parseGraphQLDateTime } from "@/utils/dateUtils"
import type { ShiftAssignment } from "@/codegen/graphql"
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
          (sum, record) => sum + record.totalRevenue,
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
    getTodayShifts()
    getTodaysShiftEvents()
  }, [user?.driver, getTodayShifts, getTodaysShiftEvents])

  const onClockIn = () => setShowClockIn(true)

  return (
    <>
      <div className="space-y-6">
        {/* Status Badge */}
        {user?.driver && <StatusBadge isOnline={!!currentShift} />}

        {/* Scheduled Trips Entry Point - Hidden for now */}
        {/* <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <CalendarClock className="h-6 w-6 text-primary" />
                <div>
                  <h3 className="font-semibold text-lg">Schedule a Trip</h3>
                  <p className="text-sm text-muted-foreground">
                    Request a future or recurring ride
                  </p>
                </div>
              </div>
              <Button
                onClick={() => navigate(Routes.scheduledTripRequest)}
                variant="default"
              >
                Schedule Trip
              </Button>
            </div>
          </CardContent>
        </Card> */}

        {/* Current Shift Status */}
        {user?.driver && (
          <CurrentShift onClockIn={onClockIn} vehicles={vehicles} />
        )}

        {/* Today's Shifts */}
        <TodaysShifts shifts={todayShiftsData?.todayShifts || []} />

        {/* Today's Activity */}
        <TodaysActivity events={todaysShiftEventsData?.todaysShiftEvents} />

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
