import { useQuery } from "@apollo/client/react"
import {
  ExpensesQueryDocument,
  type ExpensesQueryQuery,
  type ExpensesQueryQueryVariables,
  type Expense,
} from "../../codegen/graphql"

interface UseExpensesOptions {
  startDate?: string
  endDate?: string
  vehicleId?: string
  pagination?: {
    page: number
    perPage: number
  }
  skip?: boolean
}

export const useExpenses = (options: UseExpensesOptions = {}) => {
  const {
    startDate,
    endDate,
    vehicleId,
    pagination = { page: 1, perPage: 10 },
    skip,
  } = options

  const { loading, error, data, refetch } = useQuery<
    ExpensesQueryQuery,
    ExpensesQueryQueryVariables
  >(ExpensesQueryDocument, {
    variables: {
      startDate: startDate || undefined,
      endDate: endDate || undefined,
      vehicleId: vehicleId || undefined,
      pagination: {
        page: pagination.page,
        perPage: pagination.perPage,
      },
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip,
  })

  return {
    expenses: (data?.expenses?.items || []) as Expense[],
    pagination: data?.expenses?.pagination,
    loading,
    error,
    refetch,
  }
}
