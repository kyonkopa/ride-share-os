import { useState, useMemo } from "react"
import { DateTime } from "luxon"
import { usePayroll } from "@/features/payroll/usePayroll"
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
import { Users } from "lucide-react"
import { MonthSelector } from "./MonthSelector"
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"
import { useAuthorizer } from "@/hooks/useAuthorizer"
import { PermissionEnum } from "@/codegen/graphql"
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

interface PayrollDriverCardProps {
  driverName: string
  amountDue: number
  startDate: string
  dailyBreakdown: DailyBreakdown[]
}

function PayrollDriverCard({
  driverName,
  amountDue,
  startDate,
  dailyBreakdown,
}: PayrollDriverCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>{driverName}</CardTitle>
        <CardDescription>Started: {formatDate(startDate)}</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="text-2xl font-bold text-primary mb-4">
          {formatCurrency(amountDue)}
        </div>
        {dailyBreakdown.length > 0 && (
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
        )}
      </CardContent>
    </Card>
  )
}

function PayrollEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Users />
        </EmptyMedia>
        <EmptyTitle>No payroll data found</EmptyTitle>
        <EmptyDescription>
          No drivers found for the selected month.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

export function PayrollScreen() {
  const { can } = useAuthorizer()
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

  const { payroll, loading, error } = usePayroll(
    dateRange.startDate,
    dateRange.endDate,
    {
      skip: !dateRange.startDate || !dateRange.endDate,
    }
  )

  const driverPayrolls = payroll?.driverPayrolls || []
  const totalAmountDue = payroll?.totalAmountDue || 0

  if (!can(PermissionEnum.PayrollReadAccess)) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Access Denied</AlertTitle>
        <AlertDescription>
          You are not authorized to access this page.
        </AlertDescription>
      </Alert>
    )
  }

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

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold">Payroll</h1>
          <p className="text-sm text-muted-foreground">
            View amount due to each driver for the selected month
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
          {selectedMonth && payroll && (
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  Total Amount Due
                </p>
                <p className="text-3xl font-bold text-primary">
                  {formatCurrency(totalAmountDue)}
                </p>
              </div>
              <div className="text-right">
                <p className="text-sm text-muted-foreground">Drivers</p>
                <p className="text-2xl font-semibold">
                  {driverPayrolls.length}
                </p>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payroll List */}
      {driverPayrolls.length === 0 ? (
        <PayrollEmpty />
      ) : (
        <div className="space-y-4">
          <h2 className="text-xl font-semibold">Driver Payroll</h2>
          <div className="grid gap-4">
            {driverPayrolls.map((driverPayroll) => {
              // Type assertion needed until GraphQL codegen is run
              const payrollWithBreakdown =
                driverPayroll as typeof driverPayroll & {
                  dailyBreakdown?: DailyBreakdown[]
                }
              return (
                <PayrollDriverCard
                  key={driverPayroll.driver.id}
                  driverName={driverPayroll.driver.fullName}
                  amountDue={driverPayroll.amountDue}
                  startDate={driverPayroll.startDate}
                  dailyBreakdown={payrollWithBreakdown.dailyBreakdown || []}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
