import { useMemo } from "react"
import { DateTime } from "luxon"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "./ui/select"

function formatMonthYear(date: DateTime): string {
  return date.toFormat("MMMM yyyy")
}

// Generate month options up to the current month
function generateMonthOptions(): Array<{ value: string; label: string }> {
  const now = DateTime.now()
  const currentMonth = now.startOf("month")
  const options: Array<{ value: string; label: string }> = []

  // Go back 12 months from current month
  for (let i = 0; i < 12; i++) {
    const month = currentMonth.minus({ months: i })
    options.push({
      value: month.toISODate() || "",
      label: formatMonthYear(month),
    })
  }

  return options
}

export interface MonthSelectorProps {
  value: string
  onValueChange: (value: string) => void
  id?: string
  className?: string
  placeholder?: string
}

export function MonthSelector({
  value,
  onValueChange,
  id = "month-select",
  className = "w-full md:w-[300px]",
  placeholder = "Select a month",
}: MonthSelectorProps) {
  const monthOptions = useMemo(() => generateMonthOptions(), [])

  return (
    <Select value={value} onValueChange={onValueChange}>
      <SelectTrigger id={id} className={className}>
        <SelectValue placeholder={placeholder} />
      </SelectTrigger>
      <SelectContent>
        {monthOptions.map((option) => (
          <SelectItem key={option.value} value={option.value}>
            {option.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  )
}
