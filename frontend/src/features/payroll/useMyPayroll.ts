import { useQuery } from "@apollo/client/react"
import {
  MyPayrollQueryDocument,
  type MyPayrollQueryQuery,
  type MyPayrollQueryQueryVariables,
} from "../../codegen/graphql"

export const useMyPayroll = (
  startDate: string,
  endDate: string,
  options?: {
    skip?: boolean
  }
) => {
  const { loading, error, data, refetch } = useQuery<
    MyPayrollQueryQuery,
    MyPayrollQueryQueryVariables
  >(MyPayrollQueryDocument, {
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
    myPayroll: data?.myPayroll || null,
    loading,
    error,
    refetch,
  }
}
