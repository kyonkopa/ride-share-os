import { useState, useMemo } from "react"
import { DateTime } from "luxon"
import { ArrowLeft } from "lucide-react"
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon } from "lucide-react"
import { Badge } from "./ui/badge"
import { useFinanceDetails } from "@/features/finance-details/useFinanceDetails"
import { formatDate } from "@/utils/dateUtils"
import {
  TrendingUp,
  TrendingDown,
  DollarSign,
  Users,
  Receipt,
} from "lucide-react"
import { MonthSelector } from "./MonthSelector"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

export interface FinanceDetailsBreakdownViewProps {
  onBack: () => void
}

export function FinanceDetailsBreakdownView({
  onBack,
}: FinanceDetailsBreakdownViewProps) {
  const now = DateTime.now()
  const currentMonth = now.startOf("month")
  const [selectedMonth, setSelectedMonth] = useState<string>(
    currentMonth.toISODate() || ""
  )

  // Calculate date range for finance details
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

  const { financeDetails, loading, error } = useFinanceDetails(
    dateRange.startDate,
    dateRange.endDate,
    {
      skip: !dateRange.startDate || !dateRange.endDate,
    }
  )

  return (
    <div className="space-y-6">
      {/* Header with Back Button */}
      <Button variant="outline" onClick={onBack}>
        <ArrowLeft className="mr-2 h-4 w-4" />
        Back
      </Button>
      <div className="flex items-center gap-4">
        <div>
          <h1 className="text-2xl font-bold">Finance Details Breakdown</h1>
          <p className="text-sm text-muted-foreground">
            View monthly company earnings breakdown
          </p>
        </div>
      </div>

      {/* Month Selector Card */}
      <Card>
        <CardHeader>
          <CardTitle>Select Month</CardTitle>
          <CardDescription>
            Choose a month to view finance details
          </CardDescription>
        </CardHeader>
        <CardContent>
          <MonthSelector
            value={selectedMonth}
            onValueChange={setSelectedMonth}
          />
        </CardContent>
      </Card>

      {/* Show loading, error, or no data states only when month is selected */}
      {selectedMonth && (
        <>
          {loading && (
            <div className="flex items-center justify-center min-h-[400px]">
              <Spinner />
              <span className="ml-2">Loading finance details...</span>
            </div>
          )}

          {error && (
            <Alert variant="destructive">
              <AlertCircleIcon />
              <AlertTitle>Error loading finance details</AlertTitle>
              <AlertDescription>
                <p>Error: {error.message}</p>
              </AlertDescription>
            </Alert>
          )}

          {!loading && !error && !financeDetails && (
            <Alert>
              <AlertCircleIcon />
              <AlertTitle>No data available</AlertTitle>
              <AlertDescription>
                No finance details data available for the selected period.
              </AlertDescription>
            </Alert>
          )}
        </>
      )}

      {/* Show breakdown only when we have data */}
      {selectedMonth && financeDetails && !loading && !error && (
        <>
          <div className="flex items-center gap-4">
            <div>
              <p className="text-sm text-muted-foreground">
                Financial overview for {formatDate(dateRange.startDate)} -{" "}
                {formatDate(dateRange.endDate)}
              </p>
            </div>
          </div>

          {/* Summary Card */}
          <Card>
            <CardHeader>
              <CardTitle>Net Earnings</CardTitle>
              <CardDescription>
                Total company earnings after expenses and payroll
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-4">
                {financeDetails.earnings >= 0 ? (
                  <TrendingUp className="h-12 w-12 text-green-500" />
                ) : (
                  <TrendingDown className="h-12 w-12 text-red-500" />
                )}
                <div>
                  <p className="text-4xl font-bold text-primary">
                    {formatCurrency(financeDetails.earnings)}
                  </p>
                  <Badge
                    className={`mt-1 ${
                      financeDetails.earnings >= 0
                        ? "bg-green-500 hover:bg-green-600"
                        : "bg-red-500 hover:bg-red-600"
                    }`}
                  >
                    {financeDetails.earnings >= 0 ? "Profit" : "Loss"}
                  </Badge>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Breakdown Cards */}
          <div className="grid gap-4 md:grid-cols-3">
            {/* Total Revenue */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5" />
                  Total Revenue
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-primary">
                  {formatCurrency(financeDetails.totalRevenue)}
                </p>
              </CardContent>
            </Card>

            {/* Total Payroll */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Users className="h-5 w-5" />
                  Total Payroll
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(financeDetails.totalPayrollDue)}
                </p>
              </CardContent>
            </Card>

            {/* Total Expenses */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Receipt className="h-5 w-5" />
                  Total Expenses
                </CardTitle>
              </CardHeader>
              <CardContent>
                <p className="text-2xl font-bold text-destructive">
                  {formatCurrency(financeDetails.totalExpenses)}
                </p>
              </CardContent>
            </Card>
          </div>

          {/* Calculation Breakdown */}
          <Card>
            <CardHeader>
              <CardTitle>Calculation Breakdown</CardTitle>
              <CardDescription>
                How earnings are calculated for this period
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Total Revenue</span>
                  <span className="text-lg font-semibold text-primary">
                    {formatCurrency(financeDetails.totalRevenue)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Total Payroll Due</span>
                  <span className="text-lg font-semibold text-destructive">
                    - {formatCurrency(financeDetails.totalPayrollDue)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border rounded-lg">
                  <span className="font-medium">Total Expenses</span>
                  <span className="text-lg font-semibold text-destructive">
                    - {formatCurrency(financeDetails.totalExpenses)}
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 border-2 rounded-lg bg-muted">
                  <span className="font-bold text-lg">Net Earnings</span>
                  <span
                    className={`text-lg font-bold ${
                      financeDetails.earnings >= 0
                        ? "text-green-600"
                        : "text-red-600"
                    }`}
                  >
                    {formatCurrency(financeDetails.earnings)}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  )
}
