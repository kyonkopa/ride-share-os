import { useState } from "react"
import { useMutation } from "@/hooks/useMutation"
import {
  UpdateRevenueRecordMutationDocument,
  type UpdateRevenueRecordMutationMutation,
  type UpdateRevenueRecordMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"

interface UseUpdateRevenueRecordMutationOptions {
  onSuccess?: (data: UpdateRevenueRecordMutationMutation) => void
  onError?: (errors: Error[]) => void
}

export const useUpdateRevenueRecordMutation = (
  options: UseUpdateRevenueRecordMutationOptions = {}
) => {
  const { onSuccess, onError } = options
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: updateRevenueRecord, loading } = useMutation<
    UpdateRevenueRecordMutationMutation,
    UpdateRevenueRecordMutationMutationVariables
  >(UpdateRevenueRecordMutationDocument, {
    onSuccess: (data: UpdateRevenueRecordMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
    onError: (error: Error[]) => {
      setErrors(error)
      onError?.(error)
    },
  })

  const handleUpdateRevenueRecord = async (
    revenueRecordId: string,
    reconciled: boolean
  ) => {
    setErrors([])

    await updateRevenueRecord({
      variables: {
        revenueRecordId,
        reconciled,
      },
    })
  }

  return {
    handleUpdateRevenueRecord,
    errors,
    loading,
  }
}
