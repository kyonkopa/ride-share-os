import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateExpenseMutationDocument,
  ExpensesQueryDocument,
  ExpenseStatsQueryDocument,
  type CreateExpenseInput,
  type CreateExpenseMutationMutation,
  type CreateExpenseMutationMutationVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreateExpenseFormData {
  amount: number
  category: string
  date: Date
  vehicleId?: string
  receiptKey?: string
}

export const useCreateExpenseMutation = ({
  onSuccess,
  onError,
}: {
  onSuccess?: (data: CreateExpenseMutationMutation) => void
  onError?: (errors: Error[]) => void
} = {}) => {
  const [errors, setErrors] = useState<Error[]>([])

  const { mutate: createExpense, loading } = useMutation<
    CreateExpenseMutationMutation,
    CreateExpenseMutationMutationVariables
  >(CreateExpenseMutationDocument, {
    onError: (errors: Error[]) => {
      setErrors(errors)
      onError?.(errors)
    },
    onSuccess: (data: CreateExpenseMutationMutation) => {
      setErrors([])
      onSuccess?.(data)
    },
    refetchQueries: [
      {
        query: ExpensesQueryDocument,
      },
      {
        query: ExpenseStatsQueryDocument,
      },
    ],
  })

  const handleCreateExpense = async (data: CreateExpenseFormData) => {
    setErrors([])

    const input: CreateExpenseInput = {
      amount: parseFloat(data.amount.toString()),
      category: data.category,
      date: data.date.toISOString().split("T")[0],
    }

    if (data.vehicleId) {
      input.vehicleId = data.vehicleId
    }

    if (data.receiptKey) {
      input.receiptKey = data.receiptKey
    }

    await createExpense({
      variables: {
        input,
      },
    })
  }

  const validationErrors = errors.filter(
    (error) => error.code === "VALIDATION_ERROR"
  )

  return {
    handleCreateExpense,
    errors,
    loading,
    validationErrors,
  }
}
