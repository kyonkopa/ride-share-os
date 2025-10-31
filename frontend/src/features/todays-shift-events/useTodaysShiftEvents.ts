import { useLazyQuery } from "@apollo/client/react"
import {
  TodaysShiftEventsQueryDocument,
  type TodaysShiftEventsQueryQuery,
  type TodaysShiftEventsQueryQueryVariables,
} from "../../codegen/graphql"

export const useTodaysShiftEvents = () => {
  const [getTodaysShiftEvents, { loading, error, refetch, data }] =
    useLazyQuery<
      TodaysShiftEventsQueryQuery,
      TodaysShiftEventsQueryQueryVariables
    >(TodaysShiftEventsQueryDocument, {
      fetchPolicy: "cache-and-network",
      errorPolicy: "all",
      notifyOnNetworkStatusChange: true,
    })

  return {
    getTodaysShiftEvents,
    loading,
    error,
    refetch,
    data,
  }
}
