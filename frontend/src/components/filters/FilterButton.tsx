import React from "react"
import { Filter } from "lucide-react"
import { Button } from "../ui/button"
import type { FilterConfig, FilterValues } from "./types"

interface FilterButtonProps {
  onClick: () => void
  filterConfigs: FilterConfig[]
  filters: FilterValues
  className?: string
  variant?:
    | "default"
    | "outline"
    | "ghost"
    | "link"
    | "destructive"
    | "secondary"
  size?: "default" | "sm" | "lg" | "icon"
  showBadge?: boolean
  style?: React.CSSProperties
}

export function FilterButton({
  onClick,
  filterConfigs,
  filters,
  className,
  variant = "outline",
  size = "default",
  showBadge = true,
  style,
}: FilterButtonProps) {
  const activeFilterCount = filterConfigs.reduce((count, config) => {
    if (filters[config.key] !== undefined) count++
    return count
  }, 0)

  const hasActiveFilters = activeFilterCount > 0

  return (
    <Button
      onClick={onClick}
      variant={variant}
      size={size}
      className={className}
      style={style}
    >
      <Filter className="mr-2 h-4 w-4" />
      Filters
      {showBadge && hasActiveFilters && (
        <span className="ml-2 rounded-full bg-primary px-1.5 py-0.5 text-xs text-primary-foreground">
          {activeFilterCount}
        </span>
      )}
    </Button>
  )
}
