import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import { useCreateRevenueRecordMutation } from "./useCreateRevenueRecordMutation"
import { useNotification } from "@/hooks/useNotification"
import type {
  RevenueSourceEnum,
  RevenueRecordsQueryQueryVariables,
  GroupedRevenueRecordsQueryQueryVariables,
} from "@/codegen/graphql"

export interface RevenueFormValues {
  driverId: string
  date: Date
  totalRevenue: number | null
  source: RevenueSourceEnum
  reconciled: boolean
  vehicleId?: string
}

interface UseRevenueFormOptions {
  open: boolean
  onSuccess?: () => void
  revenueRecordsQueryVariables?: RevenueRecordsQueryQueryVariables
  groupedRevenueRecordsQueryVariables?: GroupedRevenueRecordsQueryQueryVariables
}

export const useRevenueForm = ({
  open,
  onSuccess,
  revenueRecordsQueryVariables,
  groupedRevenueRecordsQueryVariables,
}: UseRevenueFormOptions) => {
  const { addSuccess } = useNotification()

  const {
    handleCreateRevenueRecord,
    loading: creating,
    errors: mutationErrors,
  } = useCreateRevenueRecordMutation({
    onSuccess: () => {
      addSuccess("Revenue record created successfully")
      onSuccess?.()
    },
    revenueRecordsQueryVariables,
    groupedRevenueRecordsQueryVariables,
  })

  const validation = yup.object({
    driverId: yup.string().required("Driver is required"),
    date: yup.date().required("Date is required"),
    totalRevenue: yup
      .number()
      .required("Total revenue is required")
      .min(0, "Total revenue must be greater than or equal to 0"),
    source: yup
      .string()
      .oneOf(
        ["bolt", "uber", "off_trip"],
        "Source must be bolt, uber, or off_trip"
      )
      .required("Source is required"),
    reconciled: yup.boolean().default(false),
    vehicleId: yup.string().required("Vehicle is required"),
  }) as yup.ObjectSchema<RevenueFormValues>

  const form = useForm<RevenueFormValues>({
    defaultValues: {
      driverId: "",
      date: new Date(),
      totalRevenue: null,
      source: "bolt",
      reconciled: false,
      vehicleId: undefined,
    },
    resolver: yupResolver(validation),
  })

  const { reset } = form

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      reset({
        driverId: "",
        date: new Date(),
        totalRevenue: null,
        source: "bolt",
        reconciled: false,
        vehicleId: undefined,
      })
    }
  }, [open, reset])

  const onSubmitForm = async (data: RevenueFormValues) => {
    await handleCreateRevenueRecord({
      driverId: data.driverId,
      date: data.date,
      totalRevenue: data.totalRevenue ?? 0,
      source: data.source,
      reconciled: data.reconciled,
      vehicleId: data.vehicleId,
    })
  }

  return {
    ...form,
    onSubmitForm,
    loading: creating,
    mutationErrors,
  }
}
