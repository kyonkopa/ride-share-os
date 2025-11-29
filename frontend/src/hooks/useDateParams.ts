import { useMemo } from "react"
import { DateTime } from "luxon"
import type { FilterValues } from "@/components/filters/types"

export type DateTab =
  | "this-week"
  | "last-week"
  | "this-month"
  | "last-month"
  | "all-time"

interface UseDateParamsOptions {
  activeTab: DateTab
  filters: FilterValues
  hasActiveFilters: boolean
}

interface DateParams {
  startDate: string | undefined
  endDate: string | undefined
}

/**
 * Hook for calculating date parameters based on active tab and filters
 * Provides date ranges for common time periods (week, month, last month, all-time)
 * and handles filter-based date selection
 */
export function useDateParams({
  activeTab,
  filters,
  hasActiveFilters,
}: UseDateParamsOptions): DateParams {
  // Calculate current week start and end dates
  const weekDates = useMemo(() => {
    const now = DateTime.now()
    const weekStart = now.startOf("week")
    const weekEnd = now.endOf("week")
    return {
      start: weekStart.toISODate(),
      end: weekEnd.toISODate(),
    }
  }, [])

  // Calculate last week start and end dates
  const lastWeekDates = useMemo(() => {
    const now = DateTime.now()
    const lastWeekStart = now.minus({ weeks: 1 }).startOf("week")
    const lastWeekEnd = now.minus({ weeks: 1 }).endOf("week")
    return {
      start: lastWeekStart.toISODate(),
      end: lastWeekEnd.toISODate(),
    }
  }, [])

  // Calculate current month start and end dates
  const monthDates = useMemo(() => {
    const now = DateTime.now()
    const monthStart = now.startOf("month")
    const monthEnd = now.endOf("month")
    return {
      start: monthStart.toISODate(),
      end: monthEnd.toISODate(),
    }
  }, [])

  // Calculate last month start and end dates
  const lastMonthDates = useMemo(() => {
    const now = DateTime.now()
    const lastMonthStart = now.minus({ months: 1 }).startOf("month")
    const lastMonthEnd = now.minus({ months: 1 }).endOf("month")
    return {
      start: lastMonthStart.toISODate(),
      end: lastMonthEnd.toISODate(),
    }
  }, [])

  // Determine date parameters based on active tab and filters
  const dateParams = useMemo(() => {
    // If filters are active, only use dates explicitly set in filters
    if (hasActiveFilters) {
      const startDate = filters.startDate as Date | undefined
      const endDate = filters.endDate as Date | undefined
      return {
        startDate: startDate
          ? startDate.toISOString().split("T")[0]
          : undefined,
        endDate: endDate ? endDate.toISOString().split("T")[0] : undefined,
      }
    }

    // Otherwise, use tab-based dates
    let tabStartDate: string | undefined
    let tabEndDate: string | undefined

    if (activeTab === "this-week") {
      tabStartDate = weekDates.start
      tabEndDate = weekDates.end
    } else if (activeTab === "last-week") {
      tabStartDate = lastWeekDates.start
      tabEndDate = lastWeekDates.end
    } else if (activeTab === "this-month") {
      tabStartDate = monthDates.start
      tabEndDate = monthDates.end
    } else if (activeTab === "last-month") {
      tabStartDate = lastMonthDates.start
      tabEndDate = lastMonthDates.end
    }
    // For "all-time", tabStartDate and tabEndDate remain undefined
    // The backend will use defaults (epoch start to current date)

    return {
      startDate: tabStartDate,
      endDate: tabEndDate,
    }
  }, [
    activeTab,
    weekDates,
    lastWeekDates,
    monthDates,
    lastMonthDates,
    filters,
    hasActiveFilters,
  ])

  return dateParams
}
