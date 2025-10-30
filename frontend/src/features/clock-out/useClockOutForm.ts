import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  ClockOutMutationDocument,
  type ClockOutInput,
  type ClockOutMutationMutation,
  type ClockOutMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"

export interface ClockOutFormData {
  odometer: number
  gpsLat: number
  gpsLon: number
  range: number
  notes?: string
  earnings: number
  shiftAssignmentId?: string
  revenue: number
}

export const useClockOutForm = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ClockOutMutationMutation) => void
  onError?: (errors: Error[]) => void
} = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: clockOut, loading } = useMutation<
    ClockOutMutationMutation,
    ClockOutMutationMutationVariables
  >(ClockOutMutationDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: ClockOutMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
  })

  const onSubmit = async (data: ClockOutFormData) => {
    setErrors([])

    const input: ClockOutInput = {
      odometer: Math.round(data.odometer),
      gpsLat: data.gpsLat,
      gpsLon: data.gpsLon,
      vehicleRange: Math.round(data.range),
      notes: data.notes || undefined,
      earnings: parseFloat(data.earnings.toString()),
      revenue: parseFloat(data.revenue.toString()),
    }

    await clockOut({
      variables: {
        input,
      },
    })
  }

  // Specific error handlers
  const shiftAssignmentNotFoundError = errors.find(
    (error) => error.code === "SHIFT_ASSIGNMENT_NOT_FOUND"
  )

  const permissionDeniedError = errors.find(
    (error) => error.code === "PERMISSION_DENIED"
  )

  const notClockeInError = errors.find(
    (error) => error.code === "NOT_CLOCKED_IN"
  )

  const validationErrors = errors.filter(
    (error) =>
      error.code &&
      ![
        "SHIFT_ASSIGNMENT_NOT_FOUND",
        "PERMISSION_DENIED",
        "NOT_CLOCKED_IN",
      ].includes(error.code)
  )

  return {
    onSubmit,
    errors,
    loading,
    shiftAssignmentNotFoundError,
    permissionDeniedError,
    notClockeInError,
    validationErrors,
  }
}
