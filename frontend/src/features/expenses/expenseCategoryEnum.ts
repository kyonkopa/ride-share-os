export const ExpenseCategoryEnum = {
  Charging: "charging",
  CarWash: "car_wash",
  Maintenance: "maintenance",
  Toll: "toll",
  Insurance: "insurance",
  Other: "other",
} as const

export type ExpenseCategory =
  (typeof ExpenseCategoryEnum)[keyof typeof ExpenseCategoryEnum]

export const EXPENSE_CATEGORIES = Object.values(ExpenseCategoryEnum)
