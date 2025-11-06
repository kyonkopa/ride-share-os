import { CalendarScreen } from "./CalendarScreen"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { useMyShiftAssignments } from "@/features/my-shift-assignments/useMyShiftAssignments"
import { DateTime } from "luxon"
import { Spinner } from "./ui/spinner"

export default function CalendarScreenWrapper() {
  const { vehicles } = useVehicles()

  // Get current month date range using luxon
  const now = DateTime.now()
  const monthStart = now.startOf("month")
  const monthEnd = now.endOf("month")

  const startDate = monthStart.toISODate()
  const endDate = monthEnd.toISODate()

  const { shifts, loading } = useMyShiftAssignments(startDate, endDate)

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
        <span>Loading shifts...</span>
      </div>
    )
  }

  return <CalendarScreen shifts={shifts} vehicles={vehicles} />
}
