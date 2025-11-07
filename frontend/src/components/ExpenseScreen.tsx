import { useState, useMemo } from "react"
import { DateTime } from "luxon"
import { useExpenses } from "@/features/expenses/useExpenses"
import { useExpenseStats } from "@/features/expenses/useExpenseStats"
import { useVehicles } from "@/features/clock-in/useVehicles"
import { Spinner } from "./ui/spinner"
import { Alert, AlertDescription, AlertTitle } from "./ui/alert"
import { AlertCircleIcon, Receipt, Plus } from "lucide-react"
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
import { Badge } from "./ui/badge"
import { Tabs, TabsList, TabsTrigger, TabsContent } from "./ui/tabs"
import { Button } from "./ui/button"
import { ExpenseForm } from "./ExpenseForm"
import type { Expense } from "@/codegen/graphql"
import { Paginator } from "./pagination/paginator"

function formatCurrency(amount: number): string {
  return new Intl.NumberFormat("en-US", {
    style: "currency",
    currency: "GHS",
  }).format(amount)
}

function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString("en-US", {
    year: "numeric",
    month: "short",
    day: "numeric",
  })
}

interface ExpenseCardProps {
  expense: Expense
}

function ExpenseCard({ expense }: ExpenseCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle>{formatCurrency(expense.amount)}</CardTitle>
          <Badge variant="outline" className="capitalize">
            {expense.category}
          </Badge>
        </div>
      </CardHeader>
      <CardContent>
        <div className="space-y-1 text-sm text-muted-foreground">
          <div>Date: {formatDate(expense.date)}</div>
          {expense.user && (
            <div>
              Added by: {expense.user.firstName} {expense.user.lastName}
            </div>
          )}
          {expense.vehicle && <div>Vehicle: {expense.vehicle.displayName}</div>}
          {expense.receiptKey && (
            <div className="text-xs text-blue-600">Receipt attached</div>
          )}
        </div>
      </CardContent>
    </Card>
  )
}

function ExpensesEmpty() {
  return (
    <Empty className="border border-dashed">
      <EmptyHeader>
        <EmptyMedia variant="icon">
          <Receipt />
        </EmptyMedia>
        <EmptyTitle>No expenses found</EmptyTitle>
        <EmptyDescription>
          Expenses will appear here once they are created.
        </EmptyDescription>
      </EmptyHeader>
    </Empty>
  )
}

type ExpenseStats = {
  totalAmount: number
  count: number
  categoryTotals: Record<string, number>
}

interface ExpenseStatsBarProps {
  stats: ExpenseStats | null | undefined
  loading: boolean
}

function ExpenseStatsBar({ stats, loading }: ExpenseStatsBarProps) {
  if (loading) {
    return (
      <Card>
        <CardContent className="pt-6">
          <Spinner />
        </CardContent>
      </Card>
    )
  }

  if (!stats) return null

  return (
    <Card>
      <CardHeader>
        <CardTitle>Expense Summary</CardTitle>
        <CardDescription>Expenses for this week</CardDescription>
      </CardHeader>
      <CardContent>
        <div className="grid grid-cols-auto gap-2">
          <div className="text-center p-4 bg-muted rounded-lg border-box">
            <p className="text-2xl font-bold text-primary">
              {formatCurrency(stats.totalAmount)}
            </p>
            <p className="text-sm text-muted-foreground">Total Expenses</p>
          </div>
          <div className="text-center p-4 bg-muted rounded-lg">
            <p className="text-2xl font-bold text-primary">{stats.count}</p>
            <p className="text-sm text-muted-foreground">Total Count</p>
          </div>
        </div>
      </CardContent>
    </Card>
  )
}

export function ExpenseScreen() {
  const [activeTab, setActiveTab] = useState<"this-week" | "all-time">(
    "this-week"
  )
  const [showAddExpense, setShowAddExpense] = useState(false)
  const { vehicles } = useVehicles()
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  // Reset to page 1 when tab changes
  const handleTabChange = (value: string) => {
    setActiveTab(value as "this-week" | "all-time")
    setCurrentPage(1)
    setItemsPerPage(10)
  }

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

  // Determine date parameters based on active tab
  const dateParams = useMemo(() => {
    if (activeTab === "this-week") {
      return {
        startDate: weekDates.start,
        endDate: weekDates.end,
      }
    }
    return {
      startDate: undefined,
      endDate: undefined,
    }
  }, [activeTab, weekDates])

  const { expenses, loading, error, pagination } = useExpenses({
    startDate: dateParams.startDate,
    endDate: dateParams.endDate,
    pagination: {
      page: currentPage,
      perPage: itemsPerPage,
    },
  })

  const { stats, loading: statsLoading } = useExpenseStats(
    dateParams.startDate,
    dateParams.endDate
  )

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Spinner />
      </div>
    )
  }

  if (error) {
    return (
      <Alert variant="destructive">
        <AlertCircleIcon />
        <AlertTitle>Error loading expenses</AlertTitle>
        <AlertDescription>
          <p>Error: {error.message}</p>
        </AlertDescription>
      </Alert>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold">Expenses</h1>
        <p className="text-sm text-muted-foreground">
          View and manage your expenses
        </p>
      </div>

      <div className="flex justify-end">
        <Button onClick={() => setShowAddExpense(true)}>
          <Plus className="mr-2 h-4 w-4" />
          Add Expense
        </Button>
      </div>

      {/* Stats Bar */}
      {activeTab === "this-week" && (
        <ExpenseStatsBar stats={stats} loading={statsLoading} />
      )}

      {/* Tabs */}
      <Tabs value={activeTab} onValueChange={handleTabChange}>
        <TabsList>
          <TabsTrigger value="this-week">This Week</TabsTrigger>
          <TabsTrigger value="all-time">All Time</TabsTrigger>
        </TabsList>
        <TabsContent value="this-week" className="mt-3">
          {dateParams.startDate && dateParams.endDate && (
            <p className="text-sm text-muted-foreground mb-4">
              Showing expenses for {formatDate(dateParams.startDate)} to{" "}
              {formatDate(dateParams.endDate)}
            </p>
          )}
          {/* Expenses List */}
          {expenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
              {pagination &&
                pagination.pageCount != null &&
                pagination.pageCount > 1 && (
                  <Paginator
                    currentPage={currentPage}
                    totalPages={pagination.pageCount}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                    }}
                  />
                )}
            </div>
          )}
        </TabsContent>
        <TabsContent value="all-time" className="mt-3">
          <p className="text-sm text-muted-foreground mb-4">
            Showing all expenses
          </p>
          {/* Expenses List */}
          {expenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-2">
              {expenses.map((expense) => (
                <ExpenseCard key={expense.id} expense={expense} />
              ))}
              {pagination &&
                pagination.pageCount != null &&
                pagination.pageCount > 1 && (
                  <Paginator
                    currentPage={pagination.currentPage || 1}
                    totalPages={pagination.pageCount}
                    onPageChange={(page) => {
                      setCurrentPage(page)
                    }}
                  />
                )}
            </div>
          )}
        </TabsContent>
      </Tabs>

      {/* Add Expense Modal */}
      <ExpenseForm
        open={showAddExpense}
        onOpenChange={setShowAddExpense}
        vehicles={vehicles}
      />
    </div>
  )
}
