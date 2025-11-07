import { useQuery } from "@apollo/client/react"
import {
  RevenueStatsQueryDocument,
  type RevenueStatsQueryQuery,
  type RevenueStatsQueryQueryVariables,
} from "../../codegen/graphql"

export const useRevenueStats = (
  startDate?: string,
  endDate?: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data } = useQuery<
    RevenueStatsQueryQuery,
    RevenueStatsQueryQueryVariables
  >(RevenueStatsQueryDocument, {
    variables: {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: options?.skip,
  })

  return {
    stats: data?.revenueStats,
    loading,
    error,
  }
}
