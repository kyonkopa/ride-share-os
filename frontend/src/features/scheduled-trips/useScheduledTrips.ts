import { useQuery } from "@apollo/client/react"
import {
  ScheduledTripsQueryDocument,
  type ScheduledTripsQueryQuery,
  type ScheduledTripsQueryQueryVariables,
  type ScheduledTrip,
  type ScheduledTripsFilterInput,
} from "../../codegen/graphql"

interface UseScheduledTripsOptions {
  filter?: ScheduledTripsFilterInput
  pagination?: {
    page: number
    perPage: number
  }
  skip?: boolean
}

export const useScheduledTrips = (options: UseScheduledTripsOptions = {}) => {
  const { filter, pagination = { page: 1, perPage: 20 }, skip } = options

  const { loading, error, data, refetch } = useQuery<
    ScheduledTripsQueryQuery,
    ScheduledTripsQueryQueryVariables
  >(ScheduledTripsQueryDocument, {
    variables: {
      filter: filter || undefined,
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
    scheduledTrips: (data?.scheduledTrips?.items || []) as ScheduledTrip[],
    pagination: data?.scheduledTrips?.pagination,
    loading,
    error,
    refetch,
  }
}
