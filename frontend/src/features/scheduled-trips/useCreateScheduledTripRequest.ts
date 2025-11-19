import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateScheduledTripRequestMutationDocument,
  type CreateScheduledTripRequestInput,
  type CreateScheduledTripRequestMutationMutation,
  type CreateScheduledTripRequestMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreateScheduledTripRequestFormData {
  clientName: string
  clientEmail: string
  clientPhone: string
  pickupLocation: string
  dropoffLocation: string
  pickupDatetime: Date
  recurrenceConfig?: {
    frequency: "daily" | "weekly" | "monthly"
    interval?: number
    endDate?: Date
    occurrenceCount?: number
    daysOfWeek?: number[]
  }
}

interface UseCreateScheduledTripRequestOptions {
  onSuccess?: (data: CreateScheduledTripRequestMutationMutation) => void
  onError?: (errors: Error[]) => void
}

export const useCreateScheduledTripRequest = ({
  onSuccess,
  onError,
}: UseCreateScheduledTripRequestOptions = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: createScheduledTripRequest, loading } = useMutation<
    CreateScheduledTripRequestMutationMutation,
    CreateScheduledTripRequestMutationMutationVariables
  >(CreateScheduledTripRequestMutationDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: CreateScheduledTripRequestMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
  })

  const handleCreateScheduledTripRequest = async (
    data: CreateScheduledTripRequestFormData
  ) => {
    setErrors([])

    const input: CreateScheduledTripRequestInput = {
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDatetime: data.pickupDatetime.toISOString(),
    }

    if (data.recurrenceConfig) {
      input.recurrenceConfig = {
        frequency: data.recurrenceConfig.frequency,
        interval: data.recurrenceConfig.interval,
        occurrenceCount: data.recurrenceConfig.occurrenceCount,
        daysOfWeek: data.recurrenceConfig.daysOfWeek,
        endDate: data.recurrenceConfig.endDate
          ? data.recurrenceConfig.endDate.toISOString().split("T")[0]
          : undefined,
      }
    }

    await createScheduledTripRequest({
      variables: {
        input,
      },
    })
  }

  const validationErrors = errors.filter(
    (error) => error.code === "VALIDATION_ERROR"
  )

  return {
    handleCreateScheduledTripRequest,
    errors,
    loading,
    validationErrors,
  }
}
