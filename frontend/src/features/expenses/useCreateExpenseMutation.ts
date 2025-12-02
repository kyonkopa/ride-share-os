import { useState } from "react"
import { useMutation } from "../../hooks/useMutation"
import {
  CreateExpenseMutationDocument,
  ExpensesQueryDocument,
  GroupedExpensesQueryDocument,
  type CreateExpenseInput,
  type CreateExpenseMutationMutation,
  type CreateExpenseMutationMutationVariables,
  type ExpensesQueryQueryVariables,
  type GroupedExpensesQueryQueryVariables,
  type Error,
} from "../../codegen/graphql"

export interface CreateExpenseFormData {
  amount: number
  category: string
  date: Date
  vehicleId?: string
  receiptKey?: string
  description?: string
  overrideWarnings?: boolean
}

interface UseCreateExpenseMutationOptions {
  onSuccess?: (data: CreateExpenseMutationMutation) => void
  onError?: (errors: Error[]) => void
  expensesQueryVariables?: ExpensesQueryQueryVariables
  groupedExpensesQueryVariables?: GroupedExpensesQueryQueryVariables
}

export const useCreateExpenseMutation = ({
  onSuccess,
  onError,
  expensesQueryVariables,
  groupedExpensesQueryVariables,
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
        query: GroupedExpensesQueryDocument,
        ...(groupedExpensesQueryVariables && {
          variables: groupedExpensesQueryVariables,
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
      overrideWarnings: data.overrideWarnings || false,
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
