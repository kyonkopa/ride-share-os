import { CalendarScreen } from "./CalendarScreen"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { getFragmentData } from "@/codegen"
import { VehicleFragmentFragmentDoc } from "@/codegen/graphql"

export default function CalendarScreenWrapper() {
  const { data: vehiclesData } = useVehicles()
  const vehicles =
    vehiclesData?.vehicles.map((vehicle) =>
      getFragmentData(VehicleFragmentFragmentDoc, vehicle)
    ) || []

  return <CalendarScreen shifts={[]} vehicles={vehicles} />
}
