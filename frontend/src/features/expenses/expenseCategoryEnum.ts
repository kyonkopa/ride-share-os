export const ExpenseCategoryEnum = {
  Charging: "charging",
  Maintenance: "maintenance",
  Toll: "toll",
  Insurance: "insurance",
  Other: "other",
} as const

export type ExpenseCategory =
  (typeof ExpenseCategoryEnum)[keyof typeof ExpenseCategoryEnum]

export const EXPENSE_CATEGORIES = Object.values(ExpenseCategoryEnum)
