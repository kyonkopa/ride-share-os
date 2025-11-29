import { useState, useEffect } from "react"
import { ChevronDownIcon } from "lucide-react"
import { Button } from "./ui/button"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "./ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"
import { Calendar } from "./ui/calendar"
import { Popover, PopoverContent, PopoverTrigger } from "./ui/popover"
import { Label } from "./ui/label"
import { formatDate } from "@/utils/dateUtils"
import type { VehicleFragmentFragment } from "@/codegen/graphql"

export interface ExpenseFilterValues {
  vehicleId?: string
  startDate?: Date
  endDate?: Date
}

interface ExpenseFilterDialogProps {
  open: boolean
  onOpenChange: (open: boolean) => void
  vehicles: VehicleFragmentFragment[]
  appliedFilters: ExpenseFilterValues
  onChange: (filters: ExpenseFilterValues) => void
}

export function ExpenseFilterDialog({
  open,
  onOpenChange,
  vehicles,
  appliedFilters,
  onChange,
}: ExpenseFilterDialogProps) {
  const [draftFilters, setDraftFilters] = useState<ExpenseFilterValues>({})
  const [startDatePickerOpen, setStartDatePickerOpen] = useState(false)
  const [endDatePickerOpen, setEndDatePickerOpen] = useState(false)

  // Initialize draft filters from applied filters when dialog opens
  useEffect(() => {
    if (open) {
      setDraftFilters(appliedFilters)
    }
  }, [open, appliedFilters])

  const handleVehicleChange = (value: string) => {
    setDraftFilters({
      ...draftFilters,
      vehicleId: value === "ANY" ? undefined : value,
    })
  }

  const handleStartDateChange = (date: Date | undefined) => {
    setDraftFilters({
      ...draftFilters,
      startDate: date,
    })
    setStartDatePickerOpen(false)
  }

  const handleEndDateChange = (date: Date | undefined) => {
    setDraftFilters({
      ...draftFilters,
      endDate: date,
    })
    setEndDatePickerOpen(false)
  }

  const handleApplyFilters = () => {
    onChange(draftFilters)
    onOpenChange(false)
  }

  const handleClearFilters = () => {
    const clearedFilters: ExpenseFilterValues = {
      vehicleId: undefined,
      startDate: undefined,
      endDate: undefined,
    }
    setDraftFilters(clearedFilters)
    onChange(clearedFilters)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[500px]">
        <DialogHeader>
          <DialogTitle>Filter Expenses</DialogTitle>
          <DialogDescription>
            Filter expenses by vehicle and date range
          </DialogDescription>
        </DialogHeader>
        <div className="space-y-4 py-4">
          {/* Vehicle Filter */}
          <div className="space-y-2">
            <Label htmlFor="vehicle-filter">Vehicle</Label>
            <Select
              value={draftFilters.vehicleId || "ANY"}
              onValueChange={handleVehicleChange}
            >
              <SelectTrigger id="vehicle-filter">
                <SelectValue placeholder="All vehicles" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="ANY">All vehicles</SelectItem>
                {vehicles.map((vehicle) => (
                  <SelectItem key={vehicle.id} value={vehicle.id}>
                    {vehicle.displayName}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Start Date Filter */}
          <div className="space-y-2">
            <Label>Start Date</Label>
            <Popover
              open={startDatePickerOpen}
              onOpenChange={setStartDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {draftFilters.startDate ? (
                    formatDate(draftFilters.startDate)
                  ) : (
                    <span className="text-muted-foreground">
                      Select start date
                    </span>
                  )}
                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={draftFilters.startDate}
                  onSelect={handleStartDateChange}
                  timeZone="UTC"
                />
              </PopoverContent>
            </Popover>
          </div>

          {/* End Date Filter */}
          <div className="space-y-2">
            <Label>End Date</Label>
            <Popover
              open={endDatePickerOpen}
              onOpenChange={setEndDatePickerOpen}
            >
              <PopoverTrigger asChild>
                <Button
                  variant="outline"
                  className="w-full justify-start text-left font-normal"
                >
                  {draftFilters.endDate ? (
                    formatDate(draftFilters.endDate)
                  ) : (
                    <span className="text-muted-foreground">
                      Select end date
                    </span>
                  )}
                  <ChevronDownIcon className="ml-auto h-4 w-4 opacity-50" />
                </Button>
              </PopoverTrigger>
              <PopoverContent className="w-auto p-0" align="start">
                <Calendar
                  mode="single"
                  selected={draftFilters.endDate}
                  onSelect={handleEndDateChange}
                  disabled={(date) => date > new Date()}
                  timeZone="UTC"
                />
              </PopoverContent>
            </Popover>
          </div>
        </div>
        <DialogFooter>
          <Button variant="outline" onClick={handleClearFilters}>
            Clear Filters
          </Button>
          <Button onClick={handleApplyFilters}>Apply Filters</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  )
}
