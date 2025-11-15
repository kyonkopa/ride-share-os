import { useQuery } from "@apollo/client/react"
import {
  PayrollQueryDocument,
  type PayrollQueryQuery,
  type PayrollQueryQueryVariables,
} from "../../codegen/graphql"

export const usePayroll = (
  startDate: string,
  endDate: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data, refetch } = useQuery<
    PayrollQueryQuery,
    PayrollQueryQueryVariables
  >(PayrollQueryDocument, {
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
    payroll: data?.payroll || null,
    loading,
    error,
    refetch,
  }
}
