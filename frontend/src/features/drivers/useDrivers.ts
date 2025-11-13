import { useQuery } from "@apollo/client/react"
import {
  DriversQueryDocument,
  type DriversQueryQuery,
  type DriversQueryQueryVariables,
  type Driver,
} from "../../codegen/graphql"

export const useDrivers = (options?: { skip?: boolean }) => {
  const { loading, error, data, refetch } = useQuery<
    DriversQueryQuery,
    DriversQueryQueryVariables
  >(DriversQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: options?.skip,
  })

  return {
    drivers: (data?.drivers || []) as Driver[],
    loading,
    error,
    refetch,
  }
}
