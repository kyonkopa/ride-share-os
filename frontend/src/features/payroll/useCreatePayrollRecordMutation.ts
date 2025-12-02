import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreatePayrollRecordMutationDocument,
  PayrollQueryDocument,
  type CreatePayrollRecordInput,
  type CreatePayrollRecordMutationMutation,
  type CreatePayrollRecordMutationMutationVariables,
  type PayrollQueryQueryVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreatePayrollRecordFormData {
  driverId: string
  amountPaid: number
  periodStartDate: string
  periodEndDate: string
  notes?: string
  paidAt?: string
}

interface UseCreatePayrollRecordMutationOptions {
  onSuccess?: (data: CreatePayrollRecordMutationMutation) => void
  onError?: (errors: Error[]) => void
  payrollQueryVariables?: PayrollQueryQueryVariables
}

export const useCreatePayrollRecordMutation = ({
  onSuccess,
  onError,
  payrollQueryVariables,
}: UseCreatePayrollRecordMutationOptions = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: createPayrollRecord, loading } = useMutation<
    CreatePayrollRecordMutationMutation,
    CreatePayrollRecordMutationMutationVariables
  >(CreatePayrollRecordMutationDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: CreatePayrollRecordMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
    refetchQueries: [
      {
        query: PayrollQueryDocument,
        ...(payrollQueryVariables && { variables: payrollQueryVariables }),
      },
    ],
  })

  const handleCreatePayrollRecord = async (
    data: CreatePayrollRecordFormData
  ) => {
    setErrors([])

    const input: CreatePayrollRecordInput = {
      driverId: data.driverId,
      amountPaid: data.amountPaid,
      periodStartDate: data.periodStartDate,
      periodEndDate: data.periodEndDate,
      notes: data.notes,
      paidAt: data.paidAt,
    }

    await createPayrollRecord({
      variables: {
        input,
      },
    })
  }

  const validationErrors = errors.filter(
    (error) => error.code === "VALIDATION_ERROR"
  )

  return {
    handleCreatePayrollRecord,
    errors,
    loading,
    validationErrors,
  }
}
