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
import { PayrollDriverCard } from "./PayrollDriverCard"
import { useAuthorizer } from "@/hooks/useAuthorizer"
import { PermissionEnum } from "@/codegen/graphql"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
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

  const { payroll, loading, error, refetch } = usePayroll(
    dateRange.startDate,
    dateRange.endDate,
    {
      skip: !dateRange.startDate || !dateRange.endDate,
    }
  )

  const handlePaymentSuccess = () => {
    refetch()
  }

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
                  Total amount due
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
          <h2 className="text-xl font-semibold">Driver payroll</h2>
          <div className="grid gap-4">
            {driverPayrolls.map((driverPayroll) => {
              return (
                <PayrollDriverCard
                  key={driverPayroll.driver.id}
                  driverId={driverPayroll.driver.globalId}
                  driverName={driverPayroll.driver.fullName}
                  amountDue={driverPayroll.amountDue}
                  startDate={driverPayroll.startDate}
                  dailyBreakdown={driverPayroll.dailyBreakdown || []}
                  periodStartDate={dateRange.startDate}
                  periodEndDate={dateRange.endDate}
                  payrollRecords={driverPayroll.payrollRecords}
                  onPaymentSuccess={handlePaymentSuccess}
                />
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
