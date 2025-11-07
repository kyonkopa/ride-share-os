import { useQuery } from "@apollo/client/react"
import {
  ExpenseStatsQueryDocument,
  type ExpenseStatsQueryQuery,
  type ExpenseStatsQueryQueryVariables,
} from "../../codegen/graphql"

export const useExpenseStats = (
  startDate?: string,
  endDate?: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data } = useQuery<
    ExpenseStatsQueryQuery,
    ExpenseStatsQueryQueryVariables
  >(ExpenseStatsQueryDocument, {
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
    stats: data?.expenseStats,
    loading,
    error,
  }
}
