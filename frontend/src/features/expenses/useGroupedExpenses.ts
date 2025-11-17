import { useQuery } from "@apollo/client/react"
import {
  GroupedExpensesQueryDocument,
  type GroupedExpensesQueryQuery,
  type GroupedExpensesQueryQueryVariables,
} from "../../codegen/graphql"

interface UseGroupedExpensesOptions {
  startDate: string
  endDate: string
  driverId?: string
  pagination?: {
    page: number
    perPage: number
  }
  skip?: boolean
}

export const useGroupedExpenses = (options: UseGroupedExpensesOptions) => {
  const {
    startDate,
    endDate,
    driverId,
    pagination = { page: 1, perPage: 10 },
    skip,
  } = options

  const { loading, error, data, refetch } = useQuery<
    GroupedExpensesQueryQuery,
    GroupedExpensesQueryQueryVariables
  >(GroupedExpensesQueryDocument, {
    variables: {
      startDate,
      endDate,
      driverId: driverId || undefined,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
      },
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: skip || !startDate || !endDate,
  })

  // Type assertion needed until GraphQL codegen is run to update types
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const groupedExpenses = data?.groupedExpenses as any

  return {
    groups: data?.groupedExpenses?.items || [],
    pagination: data?.groupedExpenses?.pagination,
    stats: groupedExpenses
      ? {
          totalAmount: groupedExpenses.totalAmount as number,
          categoryTotals: groupedExpenses.categoryTotals as Record<
            string,
            number
          >,
        }
      : null,
    loading,
    error,
    refetch,
  }
}
