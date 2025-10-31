import { useMemo } from "react"
import { useQuery } from "@apollo/client/react"
import { VehiclesQueryDocument } from "@/codegen/graphql"
import { getFragmentData } from "@/codegen"
import { VehicleFragmentFragmentDoc } from "@/codegen/graphql"

export const useVehicles = () => {
  const queryResult = useQuery(VehiclesQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  })

  const vehicles = useMemo(
    () =>
      queryResult.data?.vehicles.map((vehicle) =>
        getFragmentData(VehicleFragmentFragmentDoc, vehicle)
      ) || [],
    [queryResult.data]
  )

  return {
    ...queryResult,
    vehicles,
  }
}
