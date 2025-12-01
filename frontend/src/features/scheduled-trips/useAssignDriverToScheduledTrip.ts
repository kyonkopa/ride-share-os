import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  AssignDriverToScheduledTripDocument,
  ScheduledTripsQueryDocument,
  type AssignDriverToScheduledTripMutation,
  type AssignDriverToScheduledTripMutationVariables,
  type Error,
} from "../../codegen/graphql"

interface UseAssignDriverToScheduledTripOptions {
  onSuccess?: (data: AssignDriverToScheduledTripMutation) => void
  onError?: (errors: Error[]) => void
  scheduledTripsQueryVariables?: {
    filter?: unknown
    pagination: {
      page: number
      perPage: number
    }
  }
}

export const useAssignDriverToScheduledTrip = (
  options: UseAssignDriverToScheduledTripOptions = {}
) => {
  const [errors, setErrors] = useState<Error[]>([])
  const { onSuccess, onError, scheduledTripsQueryVariables } = options

  const { mutate: assignDriver, loading } = useMutation<
    AssignDriverToScheduledTripMutation,
    AssignDriverToScheduledTripMutationVariables
  >(AssignDriverToScheduledTripDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: AssignDriverToScheduledTripMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
    refetchQueries: scheduledTripsQueryVariables
      ? [
          {
            query: ScheduledTripsQueryDocument,
            variables: scheduledTripsQueryVariables,
          },
        ]
      : undefined,
  })

  const handleAssignDriver = async (
    scheduledTripId: string,
    driverId: string
  ) => {
    setErrors([])
    await assignDriver({
      variables: {
        scheduledTripId,
        input: {
          driverId,
        },
      },
    })
  }

  return {
    handleAssignDriver,
    errors,
    loading,
  }
}
