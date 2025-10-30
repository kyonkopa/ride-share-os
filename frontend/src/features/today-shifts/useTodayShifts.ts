import { useLazyQuery } from "@apollo/client/react"
import {
  TodayShiftsQueryDocument,
  type TodayShiftsQueryQuery,
  type TodayShiftsQueryQueryVariables,
} from "../../codegen/graphql"

export const useTodayShifts = () => {
  const [getTodayShifts, { loading, error, refetch, data }] = useLazyQuery<
    TodayShiftsQueryQuery,
    TodayShiftsQueryQueryVariables
  >(TodayShiftsQueryDocument, {
    fetchPolicy: "cache-and-network",
    errorPolicy: "all",
    notifyOnNetworkStatusChange: true,
  })

  return {
    getTodayShifts,
    loading,
    error,
    refetch,
    data,
  }
}
