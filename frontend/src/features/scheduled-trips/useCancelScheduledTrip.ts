import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CancelScheduledTripDocument,
  ScheduledTripsQueryDocument,
  type CancelScheduledTripMutation,
  type CancelScheduledTripMutationVariables,
  type Error,
} from "../../codegen/graphql"

interface UseCancelScheduledTripOptions {
  onSuccess?: (data: CancelScheduledTripMutation) => void
  onError?: (errors: Error[]) => void
  scheduledTripsQueryVariables?: {
    filter?: unknown
    pagination: {
      page: number
      perPage: number
    }
  }
}

export const useCancelScheduledTrip = (
  options: UseCancelScheduledTripOptions = {}
) => {
  const [errors, setErrors] = useState<Error[]>([])
  const { onSuccess, onError, scheduledTripsQueryVariables } = options

  const { mutate: cancelTrip, loading } = useMutation<
    CancelScheduledTripMutation,
    CancelScheduledTripMutationVariables
  >(CancelScheduledTripDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: CancelScheduledTripMutation) => {
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

  const handleCancelTrip = async (scheduledTripId: string, reason?: string) => {
    setErrors([])
    await cancelTrip({
      variables: {
        scheduledTripId,
        reason: reason || undefined,
      },
    })
  }

  return {
    handleCancelTrip,
    errors,
    loading,
  }
}
