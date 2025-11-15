import { useQuery } from "@apollo/client/react"
import {
  FinanceDetailsQueryDocument,
  type FinanceDetailsQueryQuery,
  type FinanceDetailsQueryQueryVariables,
} from "../../codegen/graphql"

export const useFinanceDetails = (
  startDate: string,
  endDate: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data, refetch } = useQuery<
    FinanceDetailsQueryQuery,
    FinanceDetailsQueryQueryVariables
  >(FinanceDetailsQueryDocument, {
    variables: {
      startDate,
      endDate,
    },
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
    skip: options?.skip,
  })

  return {
    financeDetails: data?.financeDetails || null,
    loading,
    error,
    refetch,
  }
}
