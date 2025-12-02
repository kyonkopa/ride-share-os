import { useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "../ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "../ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "../ui/select"
import { Calendar } from "../ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "../ui/popover"
import { Label } from "../ui/label"
import { Input } from "../ui/input"
import { formatDate } from "@/utils/dateUtils"
import type {
  FilterConfig,
  FilterValues,
  SelectFilterConfig,
  DateFilterConfig,
  NumberFilterConfig,
  SearchFilterConfig,
  DateFilterValueType,
} from "./types"
import { DateFilterValue } from "./types"

interface FilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  title: string
  description: string
  filterConfigs: FilterConfig[]
  appliedFilters: FilterValues
  onChange: (filters: FilterValues) => void
}

export function FilterDialog({
  open,
  onOpenChange,
  title,
  description,
  filterConfigs,
  appliedFilters,
  onChange,
}: FilterDialogProps) {
  const [draftFilters, setDraftFilters] = useState<FilterValues>({})
  const [datePickerOpen, setDatePickerOpen] = useState<Record<string, boolean>>(
    {}
  )

  // Initialize draft filters from applied filters when dialog opens
  useEffect(() => {
    if (open) {
      setDraftFilters(appliedFilters)
    }
  }, [open, appliedFilters])

  const updateDraftFilter = (
    key: string,
    value: string | number | Date | undefined
  ) => {
    setDraftFilters((prev) => ({
      ...prev,
      [key]: value,
    }))
  }

  const handleApplyFilters = () => {
    onChange(draftFilters)
    onOpenChange(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: FilterValues = {}
    filterConfigs.forEach((config) => {
      clearedFilters[config.key] = undefined
    })
    setDraftFilters(clearedFilters)
    onChange(clearedFilters)
  }

  const handleCancel = () => {
    // Reset draft filters to applied filters and close dialog
    setDraftFilters(appliedFilters)
    onOpenChange(false)
  }

  // Check if there are any active filters
  const hasActiveFilters = Object.values(draftFilters).some(
    (value) => value !== undefined
  )

  // Helper function to resolve max/min date values
  const resolveDateLimit = (
    limit: Date | DateFilterValueType | string | undefined,
    filters: FilterValues
  ): Date | undefined => {
    if (limit === undefined) return undefined
    if (limit instanceof Date) return limit
    if (limit === DateFilterValue.now) return new Date()
    // If it's a string, treat it as a key referencing another field
    const referencedValue = filters[limit]
    if (referencedValue instanceof Date) return referencedValue
    if (typeof referencedValue === "string") {
      // Try to parse as ISO date string
      const parsed = new Date(referencedValue)
      if (!isNaN(parsed.getTime())) return parsed
    }
    return undefined
  }

  const renderFilter = (config: FilterConfig) => {
    switch (config.type) {
      case "select": {
        const selectConfig = config as SelectFilterConfig
        const value = draftFilters[selectConfig.key] as string | undefined
        return (
          <div key={selectConfig.key} className="space-y-2">
            <Label htmlFor={`filter-${selectConfig.key}`}>
              {selectConfig.label}
            </Label>
            <Select
              value={value || "ANY"}
              onValueChange={(newValue) =>
                updateDraftFilter(
                  selectConfig.key,
                  newValue === "ANY" ? undefined : newValue
                )
              }
            >
              <SelectTrigger id={`filter-${selectConfig.key}`}>
                <SelectValue
                  placeholder={
                    selectConfig.placeholder ||
                    `Any ${selectConfig.label.toLowerCase()}`
                  }
                />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">
                  All {selectConfig.label.toLowerCase()}
                </SelectItem>
                {selectConfig.options.map((option) => (
                  <SelectItem key={option.value} value={option.value}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        )
      }

      case "date": {
        const dateConfig = config as DateFilterConfig
        const value = draftFilters[dateConfig.key] as Date | undefined
        const pickerKey = `date-${dateConfig.key}`
        const isOpen = datePickerOpen[pickerKey] || false

        // Resolve max and min dates
        const maxDate = resolveDateLimit(dateConfig.max, draftFilters)
        const minDate = resolveDateLimit(dateConfig.min, draftFilters)

        return (
          <div key={dateConfig.key} className="space-y-2">
            <Label>{dateConfig.label}</Label>
            <Popover
              open={isOpen}
              onOpenChange={(open) =>
                setDatePickerOpen((prev) => ({ ...prev, [pickerKey]: open }))
              }
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {value ? (
                    formatDate(value)
                  ) : (
                    <span className="text-muted-foreground">
                      {dateConfig.placeholder ||
                        `Select ${dateConfig.label.toLowerCase()}`}
                    </span>
                  )}
                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={value}
                  onSelect={(date) => {
                    updateDraftFilter(dateConfig.key, date)
                    setDatePickerOpen((prev) => ({
                      ...prev,
                      [pickerKey]: false,
                    }))
                  }}
                  disabled={(date) => {
                    if (maxDate && date > maxDate) return true
                    if (minDate && date < minDate) return true
                    return false
                  }}
                  timeZone="UTC"
                />
              </PopoverContent>
            </Popover>
          </div>
        )
      }

      case "number": {
        const numberConfig = config as NumberFilterConfig
        const value = draftFilters[numberConfig.key] as number | undefined

        return (
          <div key={numberConfig.key} className="space-y-2">
            <Label htmlFor={`filter-${numberConfig.key}`}>
              {numberConfig.label}
            </Label>
            <Input
              id={`filter-${numberConfig.key}`}
              type="number"
              value={value || ""}
              onChange={(e) => {
                const numValue =
                  e.target.value === "" ? undefined : Number(e.target.value)
                updateDraftFilter(numberConfig.key, numValue)
              }}
              placeholder={numberConfig.placeholder}
              min={numberConfig.min}
              max={numberConfig.max}
            />
          </div>
        )
      }

      case "search": {
        const searchConfig = config as SearchFilterConfig
        const value = draftFilters[searchConfig.key] as string | undefined

        return (
          <div key={searchConfig.key} className="space-y-2">
            <Label htmlFor={`filter-${searchConfig.key}`}>
              {searchConfig.label}
            </Label>
            <Input
              id={`filter-${searchConfig.key}`}
              type="text"
              value={value || ""}
              onChange={(e) => {
                const textValue =
                  e.target.value === "" ? undefined : e.target.value
                updateDraftFilter(searchConfig.key, textValue)
              }}
              placeholder={searchConfig.placeholder}
            />
          </div>
        )
      }

      default:
        return null
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
          <DialogDescription>{description}</DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {filterConfigs.map((config) => renderFilter(config))}
        </div>
        <DialogFooter>
          <Button
            variant="outline"
            onClick={hasActiveFilters ? handleClearFilters : handleCancel}
          >
            {hasActiveFilters ? "Clear Filters" : "Cancel"}
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
