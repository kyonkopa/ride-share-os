import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateExpenseMutationDocument,
  ExpensesQueryDocument,
  ExpenseStatsQueryDocument,
  type CreateExpenseInput,
  type CreateExpenseMutationMutation,
  type CreateExpenseMutationMutationVariables,
  type ExpensesQueryQueryVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreateExpenseFormData {
  amount: number
  category: string
  date: Date
  vehicleId?: string
  receiptKey?: string
  description?: string
}

interface UseCreateExpenseMutationOptions {
  onSuccess?: (data: CreateExpenseMutationMutation) => void
  onError?: (errors: Error[]) => void
  expensesQueryVariables?: ExpensesQueryQueryVariables
}

export const useCreateExpenseMutation = ({
  onSuccess,
  onError,
  expensesQueryVariables,
}: UseCreateExpenseMutationOptions = {}) => {
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
        ...(expensesQueryVariables && { variables: expensesQueryVariables }),
      },
      {
        query: ExpenseStatsQueryDocument,
        ...(expensesQueryVariables && {
          variables: {
            startDate: expensesQueryVariables.startDate,
            endDate: expensesQueryVariables.endDate,
          },
        }),
      },
    ],
  })

  const handleCreateExpense = async (data: CreateExpenseFormData) => {
    setErrors([])

    const input: CreateExpenseInput = {
      amount: parseFloat(data.amount.toString()),
      category: data.category,
      date: data.date.toISOString().split("T")[0],
      description: data.description,
      receiptKey: data.receiptKey,
      vehicleId: data.vehicleId,
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
