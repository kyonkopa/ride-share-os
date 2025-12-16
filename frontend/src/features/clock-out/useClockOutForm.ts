import { useEffect, useState } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { useMutation } from "../../hooks/useMutation"
import {
  ClockOutMutationDocument,
  CurrentShiftQueryDocument,
  RecentShiftEventsQueryDocument,
  type ClockOutInput,
  type ClockOutMutationMutation,
  type ClockOutMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"

export interface ClockOutFormValues {
  odometer: number | null
  gpsLat: number | null
  gpsLon: number | null
  range: number | null
  notes?: string
  boltEarnings: number | null
  uberEarnings: number | null
  boltEarningsScreenshot: string | null
  uberEarningsScreenshot: string | null
  shiftAssignmentId?: string
}

// Validation schema
const clockOutValidationSchema = yup.object({
  odometer: yup
    .number()
    .required("End odometer reading is required")
    .min(0, "Odometer reading must be greater than or equal to 0")
    .integer("Odometer reading must be a whole number"),
  gpsLat: yup
    .number()
    .required("GPS latitude is required")
    .min(-90, "Latitude must be between -90 and 90")
    .max(90, "Latitude must be between -90 and 90"),
  gpsLon: yup
    .number()
    .required("GPS longitude is required")
    .min(-180, "Longitude must be between -180 and 180")
    .max(180, "Longitude must be between -180 and 180"),
  range: yup
    .number()
    .required("End range is required")
    .min(0, "Range must be greater than or equal to 0")
    .integer("Range must be a whole number"),
  notes: yup.string().optional(),
  boltEarnings: yup
    .number()
    .nullable()
    .optional()
    .min(0, "Bolt earnings must be greater than or equal to 0")
    .test(
      "screenshot-required",
      "Screenshot is required when Bolt earnings are entered",
      function (value) {
        const { boltEarningsScreenshot } = this.parent
        if (value !== null && value !== undefined && value > 0) {
          return !!boltEarningsScreenshot
        }
        return true
      }
    ),
  uberEarnings: yup
    .number()
    .nullable()
    .optional()
    .min(0, "Uber earnings must be greater than or equal to 0")
    .test(
      "screenshot-required",
      "Screenshot is required when Uber earnings are entered",
      function (value) {
        const { uberEarningsScreenshot } = this.parent
        if (value !== null && value !== undefined && value > 0) {
          return !!uberEarningsScreenshot
        }
        return true
      }
    ),
  boltEarningsScreenshot: yup
    .string()
    .nullable()
    .optional()
    .test("is-base64", "Invalid image format", function (value) {
      if (!value) return true // Optional if no earnings
      // Check if it's a valid data URI
      return value.startsWith("data:image/")
    }),
  uberEarningsScreenshot: yup
    .string()
    .nullable()
    .optional()
    .test("is-base64", "Invalid image format", function (value) {
      if (!value) return true // Optional if no earnings
      // Check if it's a valid data URI
      return value.startsWith("data:image/")
    }),
}) as yup.ObjectSchema<ClockOutFormValues>

interface UseClockOutFormOptions {
  open: boolean
  shiftAssignmentId?: string
  onSuccess?: (data: ClockOutMutationMutation) => void
  onError?: (errors: Error[]) => void
}

export const useClockOutForm = ({
  open,
  shiftAssignmentId,
  onSuccess,
  onError,
}: UseClockOutFormOptions) => {
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
    refetchQueries: [
      {
        query: CurrentShiftQueryDocument,
      },
      {
        query: RecentShiftEventsQueryDocument,
      },
    ],
  })

  const form = useForm<ClockOutFormValues>({
    defaultValues: {
      odometer: null,
      gpsLat: null,
      gpsLon: null,
      range: null,
      notes: "",
      boltEarnings: null,
      uberEarnings: null,
      boltEarningsScreenshot: null,
      uberEarningsScreenshot: null,
      shiftAssignmentId,
    },
    resolver: yupResolver(clockOutValidationSchema),
  })

  const { reset } = form

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      reset({
        odometer: null,
        gpsLat: null,
        gpsLon: null,
        range: null,
        notes: "",
        boltEarnings: null,
        uberEarnings: null,
        boltEarningsScreenshot: null,
        uberEarningsScreenshot: null,
        shiftAssignmentId,
      })
    }
  }, [open, reset, shiftAssignmentId])

  const onSubmitForm = async (data: ClockOutFormValues) => {
    const input: ClockOutInput & {
      boltEarningsScreenshot?: string
      uberEarningsScreenshot?: string
    } = {
      odometer: data.odometer !== null ? Math.round(data.odometer) : 0,
      gpsLat: data.gpsLat ?? 0,
      gpsLon: data.gpsLon ?? 0,
      vehicleRange: data.range !== null ? Math.round(data.range) : 0,
      notes: data.notes || undefined,
      boltEarnings:
        data.boltEarnings !== null
          ? parseFloat(data.boltEarnings.toString())
          : undefined,
      uberEarnings:
        data.uberEarnings !== null
          ? parseFloat(data.uberEarnings.toString())
          : undefined,
      boltEarningsScreenshot: data.boltEarningsScreenshot || undefined,
      uberEarningsScreenshot: data.uberEarningsScreenshot || undefined,
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
    ...form,
    onSubmitForm,
    loading,
    shiftAssignmentNotFoundError,
    permissionDeniedError,
    notClockeInError,
    validationErrors,
  }
}
