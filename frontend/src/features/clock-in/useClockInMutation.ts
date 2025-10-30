import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  ClockInMutationDocument,
  type ClockInMutationMutation,
  type Error,
} from "../../codegen/graphql"
import type { Location } from "@/types/shift"

export interface ClockInFormData {
  vehicleId: string
  odometer: number
  range: number // in kilometers
  location: Location
  notes?: string
}

export const useClockInMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: ClockInMutationMutation) => void
  onError?: (errors: Error[]) => void
}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: clockIn, loading } = useMutation<ClockInMutationMutation>(
    ClockInMutationDocument,
    {
      onError: (errors: Error[]) => {
        setErrors(errors)
        onError?.(errors)
      },
      onSuccess: (data: ClockInMutationMutation) => {
        setErrors([])
        onSuccess?.(data)
      },
    }
  )

  const handleClockIn = async (data: ClockInFormData) => {
    setErrors([])

    const input = {
      odometer: Math.round(data.odometer),
      vehicleRange: Math.round(data.range),
      gpsLat: data.location.latitude,
      gpsLon: data.location.longitude,
      notes: data.notes || undefined,
      vehicleId: data.vehicleId,
    }

    await clockIn({
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

  const alreadyClockeInError = errors.find(
    (error) => error.code === "ALREADY_CLOCKED_IN"
  )

  const validationErrors = errors.filter(
    (error) =>
      error.code &&
      ![
        "SHIFT_ASSIGNMENT_NOT_FOUND",
        "PERMISSION_DENIED",
        "ALREADY_CLOCKED_IN",
      ].includes(error.code)
  )

  return {
    handleClockIn,
    errors,
    loading,
    shiftAssignmentNotFoundError,
    permissionDeniedError,
    alreadyClockeInError,
    validationErrors,
  }
}
