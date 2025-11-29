import { X } from "lucide-react"
import { Badge } from "../ui/badge"
import { Button } from "../ui/button"
import { formatDate } from "@/utils/dateUtils"
import type { FilterConfig, FilterValues } from "./types"

interface ActiveFiltersProps {
  filterConfigs: FilterConfig[]
  filters: FilterValues
  onFilterChange: (filters: FilterValues) => void
  onClearAll: () => void
}

export function ActiveFilters({
  filterConfigs,
  filters,
  onFilterChange,
  onClearAll,
}: ActiveFiltersProps) {
  const getFilterLabel = (
    config: FilterConfig,
    value: string | number | Date | undefined
  ): string => {
    if (value === undefined) return ""

    if (config.type === "select") {
      const selectConfig = config as Extract<FilterConfig, { type: "select" }>
      const option = selectConfig.options.find(
        (opt) => opt.value === String(value)
      )
      return option?.label || String(value)
    }

    // Handle date types - check for date config, and handle both Date objects and date strings
    if (
      config.type === "date" ||
      value instanceof Date ||
      (typeof value === "string" && /^\d{4}-\d{2}-\d{2}/.test(value))
    ) {
      // formatDate accepts both Date and string
      return formatDate(value as Date | string)
    }

    // Handle search, number, and other types - convert to string
    return String(value)
  }

  const removeFilter = (key: string) => {
    onFilterChange({
      ...filters,
      [key]: undefined,
    })
  }

  const activeFilterConfigs = filterConfigs.filter((config) => {
    return filters[config.key] !== undefined
  })

  if (activeFilterConfigs.length === 0) {
    return null
  }

  return (
    <div className="flex flex-wrap items-center gap-2">
      <span className="text-sm text-muted-foreground">Active filters:</span>
      {activeFilterConfigs.map((config) => {
        const value = filters[config.key]
        if (value === undefined) return null

        return (
          <Badge key={config.key} variant="secondary" className="gap-1">
            {config.label}: {getFilterLabel(config, value)}
            <button
              onClick={() => removeFilter(config.key)}
              className="ml-1 rounded-full hover:bg-muted"
            >
              <X className="h-3 w-3" />
            </button>
          </Badge>
        )
      })}
      <Button variant="ghost" onClick={onClearAll} className="h-6 text-sm">
        Clear all
      </Button>
    </div>
  )
}
