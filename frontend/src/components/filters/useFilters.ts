import { useState, useMemo } from "react"
import type { FilterConfig, FilterValues } from "./types"

interface UseFiltersOptions {
  filterConfigs: FilterConfig[]
  onFiltersChange?: (filters: FilterValues) => void
}

export function useFilters({
  filterConfigs,
  onFiltersChange,
}: UseFiltersOptions) {
  const [filters, setFilters] = useState<FilterValues>({})

  const hasActiveFilters = useMemo(() => {
    return filterConfigs.some((config) => {
      return filters[config.key] !== undefined
    })
  }, [filters, filterConfigs])

  const handleFiltersChange = (newFilters: FilterValues) => {
    setFilters(newFilters)
    onFiltersChange?.(newFilters)
  }

  const clearFilters = () => {
    const clearedFilters: FilterValues = {}
    filterConfigs.forEach((config) => {
      clearedFilters[config.key] = undefined
    })
    handleFiltersChange(clearedFilters)
  }

  return {
    filters,
    hasActiveFilters,
    setFilters: handleFiltersChange,
    clearFilters,
  }
}
