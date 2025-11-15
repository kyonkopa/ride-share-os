import { useEffect } from "react"
import { useForm } from "react-hook-form"
import * as yup from "yup"
import { yupResolver } from "@hookform/resolvers/yup"
import {
  ExpenseCategoryEnum,
  type ExpenseCategory,
} from "./expenseCategoryEnum"
import { useCreateExpenseMutation } from "./useCreateExpenseMutation"
import { useNotification } from "@/hooks/useNotification"
import type { ExpensesQueryQueryVariables } from "../../codegen/graphql"

export interface ExpenseFormValues {
  amount: number
  category: ExpenseCategory
  date: Date
  vehicleId?: string
  description?: string
}

interface UseExpenseFormOptions {
  open: boolean
  onSuccess?: () => void
  expensesQueryVariables?: ExpensesQueryQueryVariables
}

export const useExpenseForm = ({
  open,
  onSuccess,
  expensesQueryVariables,
}: UseExpenseFormOptions) => {
  const { addSuccess } = useNotification()

  const { handleCreateExpense, loading: creating } = useCreateExpenseMutation({
    onSuccess: () => {
      addSuccess("Expense created successfully")
      onSuccess?.()
    },
    expensesQueryVariables,
  })

  const validation = yup.object({
    amount: yup
      .number()
      .required("Amount is required")
      .min(0.01, "Amount must be greater than 0"),
    category: yup
      .string()
      .oneOf(Object.values(ExpenseCategoryEnum), "Invalid category")
      .required("Category is required"),
    date: yup.date().required("Date is required"),
    vehicleId: yup.string().when("category", {
      is: (value: ExpenseCategory) =>
        value === ExpenseCategoryEnum.Charging ||
        value === ExpenseCategoryEnum.Maintenance ||
        value === ExpenseCategoryEnum.Insurance,
      then: (schema) =>
        schema.required("Vehicle is required for this expense category"),
      otherwise: (schema) => schema.optional(),
    }),
    description: yup.string().when("category", {
      is: (value: ExpenseCategory) => value === ExpenseCategoryEnum.Other,
      then: (schema) =>
        schema.required("Description is required when category is 'Other'"),
      otherwise: (schema) => schema.optional(),
    }),
  }) as yup.ObjectSchema<ExpenseFormValues>

  const form = useForm<ExpenseFormValues>({
    defaultValues: {
      amount: 0,
      category: ExpenseCategoryEnum.Other,
      date: new Date(),
      description: "",
    },
    resolver: yupResolver(validation),
  })

  const { reset } = form

  // Reset form when modal is closed
  useEffect(() => {
    if (!open) {
      reset({
        amount: 0,
        date: new Date(),
        description: "",
      })
    }
  }, [open, reset])

  const onSubmitForm = async (data: ExpenseFormValues) => {
    await handleCreateExpense({
      amount: data.amount,
      category: data.category,
      date: data.date,
      vehicleId: data.vehicleId,
      description: data.description,
    })
  }

  return {
    ...form,
    onSubmitForm,
    loading: creating,
  }
}
