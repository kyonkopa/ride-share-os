import { useQuery } from "@apollo/client/react"
import { CurrentShiftQueryDocument } from "@/codegen/graphql"

export const useCurrentShiftQuery = () => {
  return useQuery(CurrentShiftQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  })
}
