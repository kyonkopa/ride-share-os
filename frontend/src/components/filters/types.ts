export const DateFilterValue = {
  now: "now",
} as const

export type DateFilterValueType =
  (typeof DateFilterValue)[keyof typeof DateFilterValue]

export type FilterType = "select" | "date" | "number" | "search"

export interface BaseFilterConfig {
  key: string
  label: string
  type: FilterType
}

export interface SelectFilterConfig extends BaseFilterConfig {
  type: "select"
  options: Array<{ value: string; label: string }>
  placeholder?: string
}

export interface DateFilterConfig extends BaseFilterConfig {
  type: "date"
  max?: Date | DateFilterValueType | string // Date object, enum value, or key referencing another field
  min?: Date | DateFilterValueType | string // Date object, enum value, or key referencing another field
  placeholder?: string
}

export interface NumberFilterConfig extends BaseFilterConfig {
  type: "number"
  min?: number
  max?: number
  placeholder?: string
}

export interface SearchFilterConfig extends BaseFilterConfig {
  type: "search"
  placeholder?: string
}

export type FilterConfig =
  | SelectFilterConfig
  | DateFilterConfig
  | NumberFilterConfig
  | SearchFilterConfig

export type FilterValues = Record<string, string | number | Date | undefined>
