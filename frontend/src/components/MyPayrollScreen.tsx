import { useState, useMemo } from "react"
import { DateTime } from "luxon"
import { useMyPayroll } from "@/features/payroll/useMyPayroll"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"
import {
  Empty,
  EmptyDescription,
  EmptyHeader,
  EmptyMedia,
  EmptyTitle,
} from "./ui/empty"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "./ui/card"
import { Wallet } from "lucide-react"
import { MonthSelector } from "./MonthSelector"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { formatDate } from "@/utils/dateUtils"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

interface DailyBreakdown {
  date: string
  revenue: number
  amountDue: number
}

function MyPayrollEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Wallet />
        </EmptyMedia>
        <EmptyTitle>No payroll data found</EmptyTitle>
        <EmptyDescription>
          No payroll data found for the selected month.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function MyPayrollScreen() {
  const now = DateTime.now()
  const currentMonth = now.startOf("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(
    currentMonth.toISODate() || ""
  )

  // Calculate start and end dates for the selected month
  const dateRange = useMemo(() => {
    if (!selectedMonth) {
      return { startDate: "", endDate: "" }
    }

    const monthStart = DateTime.fromISO(selectedMonth).startOf("month")
    const monthEnd = DateTime.fromISO(selectedMonth).endOf("month")

    return {
      startDate: monthStart.toISODate() || "",
      endDate: monthEnd.toISODate() || "",
    }
  }, [selectedMonth])

  const { myPayroll, loading, error } = useMyPayroll(
    dateRange.startDate,
    dateRange.endDate,
    {
      skip: !dateRange.startDate || !dateRange.endDate,
    }
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <Spinner />
        <span className="ml-2">Loading payroll data...</span>
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Error loading payroll data</AlertTitle>
        <AlertDescription>
          <p>Error: {error.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  if (!myPayroll) {
    return (
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">My Payroll</h1>
            <p className="text-sm text-muted-foreground">
              View your payroll information for the selected month
            </p>
          </div>
        </div>

        {/* Summary Card */}
        <Card>
          <CardHeader>
            <CardTitle>Summary</CardTitle>
            <CardDescription>Select a month to view payroll</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            {/* Month Selector */}
            <div className="space-y-2">
              <MonthSelector
                value={selectedMonth}
                onValueChange={setSelectedMonth}
              />
            </div>
          </CardContent>
        </Card>

        <MyPayrollEmpty />
      </div>
    )
  }

  const dailyBreakdown = (myPayroll.dailyBreakdown || []) as DailyBreakdown[]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">My Payroll</h1>
          <p className="text-sm text-muted-foreground">
            View your payroll information for the selected month
          </p>
        </div>
      </div>

      {/* Summary Card */}
      <Card>
        <CardHeader>
          <CardTitle>Summary</CardTitle>
          <CardDescription>Select a month to view payroll</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          {/* Month Selector */}
          <div className="space-y-2">
            <MonthSelector
              value={selectedMonth}
              onValueChange={setSelectedMonth}
            />
          </div>

          {/* Summary Stats */}
          {selectedMonth && myPayroll && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Amount Due
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(myPayroll.amountDue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Start Date</p>
                <p className="text-lg font-semibold">
                  {formatDate(myPayroll.startDate)}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll Details */}
      {dailyBreakdown.length === 0 ? (
        <MyPayrollEmpty />
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Daily Breakdown</CardTitle>
            <CardDescription>
              Revenue and amount due for each day in the selected month
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Accordion type="single" collapsible className="w-full">
              <AccordionItem value="breakdown" className="border-none">
                <AccordionTrigger className="py-2 text-sm">
                  <span className="truncate underline text-primary">
                    View Daily Breakdown ({dailyBreakdown.length} days)
                  </span>
                </AccordionTrigger>
                <AccordionContent>
                  <div className="space-y-2 pt-2">
                    {dailyBreakdown.map((day) => (
                      <div
                        key={day.date}
                        className="flex items-center justify-between rounded-md border p-2"
                      >
                        <div className="flex flex-col">
                          <span className="font-medium text-sm">
                            {formatDate(day.date)}
                          </span>
                          <span className="text-xs text-muted-foreground">
                            Revenue: {formatCurrency(day.revenue)}
                          </span>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold">
                            {formatCurrency(day.amountDue)}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </AccordionContent>
              </AccordionItem>
            </Accordion>
          </CardContent>
        </Card>
      )}
    </div>
  )
}
