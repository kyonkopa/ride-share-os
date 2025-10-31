import { CalendarScreen } from "./CalendarScreen"
import { useVehicles } from "@/features/clock-in/useVehicles"

export default function CalendarScreenWrapper() {
  const { vehicles } = useVehicles()

  return <CalendarScreen shifts={[]} vehicles={vehicles} />
}
