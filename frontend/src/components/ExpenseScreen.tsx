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
import {
  Accordion,
  AccordionContent,
  AccordionItem,
  AccordionTrigger,
} from "./ui/accordion"

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

type MergedExpense = {
  vehicleId: string
  vehicleName: string
  totalAmount: number
  expenseCount: number
  expenses: Expense[]
}

interface MergedExpenseCardProps {
  mergedExpense: MergedExpense
}

function MergedExpenseCard({ mergedExpense }: MergedExpenseCardProps) {
  return (
    <Card className="gap-2">
      <CardHeader className="flex items-center justify-between">
        <div>
          <CardTitle>{formatCurrency(mergedExpense.totalAmount)}</CardTitle>
          <CardDescription className="mt-1">
            {mergedExpense.vehicleName}
          </CardDescription>
        </div>
        <Badge variant="outline">
          {mergedExpense.expenseCount}{" "}
          {mergedExpense.expenseCount === 1 ? "expense" : "expenses"}
        </Badge>
      </CardHeader>
      <CardContent>
        {mergedExpense.expenses.length > 0 && (
          <Accordion type="single" collapsible className="w-full">
            <AccordionItem value="breakdown" className="border-none">
              <AccordionTrigger className="py-2 text-sm">
                <span className="truncate underline">
                  View Expense Breakdown
                </span>
              </AccordionTrigger>
              <AccordionContent>
                <div className="space-y-2 pt-2">
                  {mergedExpense.expenses.map((expense) => (
                    <div
                      key={expense.id}
                      className="flex items-center justify-between rounded-md border p-2"
                    >
                      <div className="flex flex-col gap-1">
                        <div className="flex items-center gap-2">
                          <span className="font-medium capitalize">
                            {expense.category}
                          </span>
                          {expense.receiptKey && (
                            <Badge variant="outline" className="text-xs">
                              Receipt
                            </Badge>
                          )}
                        </div>
                        <div className="text-xs text-muted-foreground">
                          {formatDate(expense.date)}
                          {expense.user && (
                            <span>
                              {" "}
                              • Added by {expense.user.firstName}{" "}
                              {expense.user.lastName}
                            </span>
                          )}
                        </div>
                      </div>
                      <div className="text-right">
                        <div className="font-semibold">
                          {formatCurrency(expense.amount)}
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

  // Merge expenses by vehicle ID
  const mergedExpenses = useMemo(() => {
    const mergedMap = new Map<string, MergedExpense>()

    expenses.forEach((expense) => {
      // Handle expenses without a vehicle - group them separately
      const vehicleId = expense.vehicle?.id || "no-vehicle"
      const vehicleName = expense.vehicle?.displayName || "No Vehicle"

      const existing = mergedMap.get(vehicleId)

      if (existing) {
        // Update totals
        existing.totalAmount += expense.amount
        existing.expenseCount += 1
        existing.expenses.push(expense)
      } else {
        // Create new merged expense
        mergedMap.set(vehicleId, {
          vehicleId,
          vehicleName,
          totalAmount: expense.amount,
          expenseCount: 1,
          expenses: [expense],
        })
      }
    })

    // Sort by total amount descending, then by vehicle name
    return Array.from(mergedMap.values()).sort((a, b) => {
      if (b.totalAmount !== a.totalAmount) {
        return b.totalAmount - a.totalAmount
      }
      return a.vehicleName.localeCompare(b.vehicleName)
    })
  }, [expenses])

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
          {mergedExpenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedExpenses.map((mergedExpense) => (
                <MergedExpenseCard
                  key={mergedExpense.vehicleId}
                  mergedExpense={mergedExpense}
                />
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
          {mergedExpenses.length === 0 ? (
            <ExpensesEmpty />
          ) : (
            <div className="flex flex-col gap-4">
              {mergedExpenses.map((mergedExpense) => (
                <MergedExpenseCard
                  key={mergedExpense.vehicleId}
                  mergedExpense={mergedExpense}
                />
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
