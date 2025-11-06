import { useQuery } from "@apollo/client/react"
import {
  RevenueRecordsQueryDocument,
  type RevenueRecordsQueryQuery,
  type RevenueRecordsQueryQueryVariables,
  type RevenueRecord,
} from "../../codegen/graphql"

export const useRevenueRecords = (
  startDate?: string,
  endDate?: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data, refetch } = useQuery<
    RevenueRecordsQueryQuery,
    RevenueRecordsQueryQueryVariables
  >(RevenueRecordsQueryDocument, {
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
    revenueRecords: (data?.revenueRecords || []) as RevenueRecord[],
    loading,
    error,
    refetch,
  }
}
