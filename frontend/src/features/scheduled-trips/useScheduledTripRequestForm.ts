import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { useCreateScheduledTripRequest } from "./useCreateScheduledTripRequest"
import { useNotification } from "@/hooks/useNotification"
import { useNavigate } from "react-router-dom"
import { Routes } from "@/routes/routes.utilities"

export interface ScheduledTripRequestFormValues {
  clientName: string
  clientEmail: string
  clientPhone: string
  pickupLocation: string
  dropoffLocation: string
  pickupDate: Date | null
  pickupTime: string
  isRecurring: boolean
  recurrenceFrequency: "daily" | "weekly" | "monthly"
  recurrenceInterval: string
  recurrenceEndDate: Date | null
  recurrenceOccurrenceCount: string
  recurrenceDaysOfWeek: number[]
}

export const useScheduledTripRequestForm = () => {
  const navigate = useNavigate()
  const { addSuccess } = useNotification()

  const {
    handleCreateScheduledTripRequest,
    errors,
    loading: creating,
    validationErrors,
  } = useCreateScheduledTripRequest({
    onSuccess: () => {
      addSuccess("Scheduled trip request submitted successfully")
      navigate(Routes.scheduledTrips)
    },
  })

  const validation = yup.object({
    clientName: yup.string().required("Client name is required"),
    clientEmail: yup
      .string()
      .email("Invalid email address")
      .required("Client email is required"),
    clientPhone: yup.string().required("Client phone is required"),
    pickupLocation: yup.string().required("Pickup location is required"),
    dropoffLocation: yup.string().required("Drop-off location is required"),
    pickupDate: yup
      .date()
      .nullable()
      .required("Pickup date is required")
      .test(
        "not-past",
        "Pickup date must be today or in the future",
        (value) => {
          if (!value) return false
          const today = new Date()
          today.setHours(0, 0, 0, 0)
          const selectedDate = new Date(value)
          selectedDate.setHours(0, 0, 0, 0)
          return selectedDate >= today
        }
      ),
    pickupTime: yup.string().required("Pickup time is required"),
    isRecurring: yup.boolean().default(false),
    recurrenceFrequency: yup
      .string()
      .oneOf(["daily", "weekly", "monthly"], "Invalid frequency")
      .when("isRecurring", {
        is: true,
        then: (schema) => schema.required("Frequency is required"),
        otherwise: (schema) => schema.optional(),
      }),
    recurrenceInterval: yup.string().when("isRecurring", {
      is: true,
      then: (schema) =>
        schema
          .required("Interval is required")
          .test("is-positive", "Interval must be greater than 0", (value) => {
            const num = parseInt(value || "0")
            return num > 0
          }),
      otherwise: (schema) => schema.optional(),
    }),
    recurrenceEndDate: yup.date().nullable().optional(),
    recurrenceOccurrenceCount: yup.string().optional(),
    recurrenceDaysOfWeek: yup.array().of(yup.number()).default([]),
  }) as yup.ObjectSchema<ScheduledTripRequestFormValues>

  const form = useForm<ScheduledTripRequestFormValues>({
    defaultValues: {
      clientName: "",
      clientEmail: "",
      clientPhone: "",
      pickupLocation: "",
      dropoffLocation: "",
      pickupDate: null,
      pickupTime: "",
      isRecurring: false,
      recurrenceFrequency: "daily",
      recurrenceInterval: "1",
      recurrenceEndDate: null,
      recurrenceOccurrenceCount: "",
      recurrenceDaysOfWeek: [],
    },
    resolver: yupResolver(validation),
    mode: "onChange",
  })

  const onSubmitForm = async (data: ScheduledTripRequestFormValues) => {
    if (!data.pickupDate || !data.pickupTime) {
      return
    }

    // Combine date and time
    const pickupDateTime = new Date(data.pickupDate)
    const [hours, minutes] = data.pickupTime.split(":").map(Number)
    pickupDateTime.setHours(hours, minutes, 0, 0)

    await handleCreateScheduledTripRequest({
      clientName: data.clientName,
      clientEmail: data.clientEmail,
      clientPhone: data.clientPhone,
      pickupLocation: data.pickupLocation,
      dropoffLocation: data.dropoffLocation,
      pickupDatetime: pickupDateTime,
      recurrenceConfig: data.isRecurring
        ? {
            frequency: data.recurrenceFrequency,
            interval:
              data.recurrenceInterval !== ""
                ? parseInt(data.recurrenceInterval)
                : undefined,
            endDate: data.recurrenceEndDate || undefined,
            occurrenceCount:
              data.recurrenceOccurrenceCount !== ""
                ? parseInt(data.recurrenceOccurrenceCount)
                : undefined,
            daysOfWeek:
              data.recurrenceFrequency === "weekly" &&
              data.recurrenceDaysOfWeek.length > 0
                ? data.recurrenceDaysOfWeek
                : undefined,
          }
        : undefined,
    })
  }

  // Combine validation errors and other errors
  const mutationErrors = [
    ...validationErrors,
    ...errors.filter((error) => error.code !== "VALIDATION_ERROR"),
  ]

  return {
    ...form,
    onSubmitForm,
    loading: creating,
    mutationErrors,
  }
}
