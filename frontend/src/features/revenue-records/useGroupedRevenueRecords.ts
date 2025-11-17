import { useQuery } from "@apollo/client/react"
import {
  GroupedRevenueRecordsQueryDocument,
  type GroupedRevenueRecordsQueryQuery,
  type GroupedRevenueRecordsQueryQueryVariables,
} from "../../codegen/graphql"

interface UseGroupedRevenueRecordsOptions {
  startDate?: string
  endDate?: string
  driverId?: string
  pagination?: {
    page: number
    perPage: number
  }
  skip?: boolean
}

export const useGroupedRevenueRecords = (
  options: UseGroupedRevenueRecordsOptions
) => {
  const {
    startDate,
    endDate,
    driverId,
    pagination = { page: 1, perPage: 20 },
    skip,
  } = options

  const { loading, error, data, refetch } = useQuery<
    GroupedRevenueRecordsQueryQuery,
    GroupedRevenueRecordsQueryQueryVariables
  >(GroupedRevenueRecordsQueryDocument, {
    variables: {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      driverId: driverId || undefined,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
      },
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: skip || false,
  })

  // Type assertion needed until GraphQL codegen is run to update types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedRevenueRecords = data?.groupedRevenueRecords as any

  return {
    groups: data?.groupedRevenueRecords?.items || [],
    pagination: data?.groupedRevenueRecords?.pagination,
    stats: groupedRevenueRecords
      ? {
          totalRevenue: groupedRevenueRecords.totalRevenue as number,
          totalProfit: groupedRevenueRecords.totalProfit as number,
          sourceTotals: groupedRevenueRecords.sourceTotals as Record<
            string,
            { revenue: number; profit: number }
          >,
        }
      : null,
    loading,
    error,
    refetch,
  }
}
