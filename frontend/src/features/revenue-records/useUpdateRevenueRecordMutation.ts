import { useMutation } from "@/hooks/useMutation"
import {
  UpdateRevenueRecordMutationDocument,
  type UpdateRevenueRecordMutationMutation,
  type UpdateRevenueRecordMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"
import { useNotification } from "@/hooks/useNotification"

interface UseUpdateRevenueRecordMutationOptions {
  onSuccess?: (data: UpdateRevenueRecordMutationMutation) => void
  onError?: (errors: Error[]) => void
}

export const useUpdateRevenueRecordMutation = (
  options: UseUpdateRevenueRecordMutationOptions = {}
) => {
  const { onSuccess, onError } = options
  const { addError } = useNotification()

  const { mutate: updateRevenueRecord, loading } = useMutation<
    UpdateRevenueRecordMutationMutation,
    UpdateRevenueRecordMutationMutationVariables
  >(UpdateRevenueRecordMutationDocument, {
    onSuccess: (data: UpdateRevenueRecordMutationMutation) => {
      onSuccess?.(data)
    },
    onError: (errors: Error[]) => {
      onError?.(errors as Error[])
      errors.forEach((error) => {
        addError(error.message || "Failed to update revenue record")
      })
    },
  })

  const handleUpdateRevenueRecord = async (
    revenueRecordId: string,
    reconciled: boolean
  ) => {
    await updateRevenueRecord({
      variables: {
        revenueRecordId,
        reconciled,
      },
    })
  }

  return {
    handleUpdateRevenueRecord,
    loading,
  }
}
