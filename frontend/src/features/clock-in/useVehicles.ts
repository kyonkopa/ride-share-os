import { useQuery } from "@apollo/client/react"
import { VehiclesQueryDocument } from "@/codegen/graphql"

export const useVehicles = () => {
  return useQuery(VehiclesQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  })
}
