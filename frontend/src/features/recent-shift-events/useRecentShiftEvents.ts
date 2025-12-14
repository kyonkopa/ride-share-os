import { useQuery } from "@apollo/client/react"
import {
  RecentShiftEventsQueryDocument,
  type RecentShiftEventsQueryQuery,
  type RecentShiftEventsQueryQueryVariables,
} from "../../codegen/graphql"

interface UseRecentShiftEventsOptions {
  pagination?: {
    page: number
    perPage: number
  }
  skip?: boolean
}

export const useRecentShiftEvents = (
  options: UseRecentShiftEventsOptions = {}
) => {
  const { pagination = { page: 1, perPage: 10 }, skip = false } = options

  const { loading, error, data, refetch } = useQuery<
    RecentShiftEventsQueryQuery,
    RecentShiftEventsQueryQueryVariables
  >(RecentShiftEventsQueryDocument, {
    variables: {
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
    loading,
    error,
    refetch,
    data,
    events: data?.recentShiftEvents?.items || [],
    pagination: data?.recentShiftEvents?.pagination,
  }
}
