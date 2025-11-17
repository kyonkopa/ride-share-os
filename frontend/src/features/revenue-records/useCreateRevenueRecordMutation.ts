import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateRevenueRecordMutationDocument,
  RevenueRecordsQueryDocument,
  GroupedRevenueRecordsQueryDocument,
  type CreateRevenueRecordInput,
  type CreateRevenueRecordMutationMutation,
  type CreateRevenueRecordMutationMutationVariables,
  type RevenueRecordsQueryQueryVariables,
  type GroupedRevenueRecordsQueryQueryVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreateRevenueRecordFormData {
  driverId: string
  date: Date
  totalRevenue: number
  source: "bolt" | "uber" | "off_trip"
  reconciled?: boolean
  vehicleId?: string
}

interface UseCreateRevenueRecordMutationOptions {
  onSuccess?: (data: CreateRevenueRecordMutationMutation) => void
  onError?: (errors: Error[]) => void
  revenueRecordsQueryVariables?: RevenueRecordsQueryQueryVariables
  groupedRevenueRecordsQueryVariables?: GroupedRevenueRecordsQueryQueryVariables
}

export const useCreateRevenueRecordMutation = ({
  onSuccess,
  onError,
  revenueRecordsQueryVariables,
  groupedRevenueRecordsQueryVariables,
}: UseCreateRevenueRecordMutationOptions = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: createRevenueRecord, loading } = useMutation<
    CreateRevenueRecordMutationMutation,
    CreateRevenueRecordMutationMutationVariables
  >(CreateRevenueRecordMutationDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: CreateRevenueRecordMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
    refetchQueries: [
      {
        query: RevenueRecordsQueryDocument,
        ...(revenueRecordsQueryVariables && {
          variables: revenueRecordsQueryVariables,
        }),
      },
      ...(groupedRevenueRecordsQueryVariables
        ? [
            {
              query: GroupedRevenueRecordsQueryDocument,
              variables: groupedRevenueRecordsQueryVariables,
            },
          ]
        : []),
    ],
  })

  const handleCreateRevenueRecord = async (
    data: CreateRevenueRecordFormData
  ) => {
    setErrors([])

    const input: CreateRevenueRecordInput = {
      driverId: data.driverId,
      date: data.date.toISOString().split("T")[0],
      totalRevenue: parseFloat(data.totalRevenue.toString()),
      source: data.source as CreateRevenueRecordInput["source"], // Type will be updated after schema regeneration
      vehicleId: data.vehicleId || "",
    }

    if (data.reconciled !== undefined) {
      input.reconciled = data.reconciled
    }

    await createRevenueRecord({
      variables: {
        input,
      },
    })
  }

  const validationErrors = errors.filter(
    (error) => error.code === "VALIDATION_ERROR"
  )

  return {
    handleCreateRevenueRecord,
    errors,
    loading,
    validationErrors,
  }
}
